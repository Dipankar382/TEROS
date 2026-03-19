#include "WebsocketServer.h"
#include "../core/GlobalState.h"
#include "../core/StateMachine.h"
#include <iostream>


using nlohmann::json;
using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;

WebsocketServer::WebsocketServer() {
    m_server.set_access_channels(websocketpp::log::alevel::all);
    m_server.clear_access_channels(websocketpp::log::alevel::frame_payload);

    m_server.init_asio();

    m_server.set_open_handler(bind(&WebsocketServer::on_open, this, _1));
    m_server.set_close_handler(bind(&WebsocketServer::on_close, this, _1));
    m_server.set_message_handler(bind(&WebsocketServer::on_message, this, _1, _2));
}

void WebsocketServer::run(uint16_t port) {
    m_server.listen(port);
    m_server.start_accept();
    std::cout << "[WebsocketServer] Listening on port " << port << std::endl;
    m_server.run();
}

void WebsocketServer::on_open(websocketpp::connection_hdl hdl) {
    std::cout << "[WebsocketServer] Connection opened" << std::endl;
}

void WebsocketServer::on_close(websocketpp::connection_hdl hdl) {
    std::cout << "[WebsocketServer] Connection closed" << std::endl;
    User* user = GlobalState::getInstance().getUserByHdl(hdl);
    if (user) {
        GlobalState::getInstance().removeUser(user->id);
    }
}

void WebsocketServer::on_message(websocketpp::connection_hdl hdl, server::message_ptr msg) {
    try {
        json payload = json::parse(msg->get_payload());
        std::string type = payload.value("type", "");

        if (type == "AUTH") {
            handle_auth(hdl, payload);
        } else if (type == "SOS_REQUEST") {
            handle_sos(hdl, payload);
        } else if (type == "DRIVER_TELEMETRY") {
            handle_telemetry(hdl, payload);
        } else if (type == "STATE_TRANSITION") {
            handle_state_transition(hdl, payload);
        } else if (type == "UPDATE_EMERGENCY_COORDS") {
            handle_emergency_coords(hdl, payload);
        } else if (type == "UPDATE_SOS_STATUS") {
            handle_sos_status_update(hdl, payload);
        } else if (type == "UPDATE_MAP_LAYERS") {
            handle_map_layers_update(hdl, payload);
        } else if (type == "UPDATE_HOSPITAL_DATA") {
            handle_hospital_data_update(hdl, payload);
        }
    } catch (const json::parse_error& e) {
        std::cerr << "[WebsocketServer] JSON parse error: " << e.what() << std::endl;
    }
}

void WebsocketServer::handle_auth(websocketpp::connection_hdl hdl, const json& payload) {
    std::string id = payload.value("id", "guest");
    std::string role_str = payload.value("role", "UNKNOWN");
    
    UserRole role = UserRole::UNKNOWN;
    if (role_str == "ADMIN") role = UserRole::ADMIN;
    else if (role_str == "HOSPITAL") role = UserRole::HOSPITAL;
    else if (role_str == "PATIENT") role = UserRole::PATIENT;
    else if (role_str == "DRIVER") role = UserRole::DRIVER;

    GlobalState::getInstance().addUser(id, role, hdl);
    std::cout << "[WebsocketServer] User authenticated: " << id << " as " << role_str << std::endl;

    // Send AUTH_SUCCESS with current fleet state back to the connecting client
    auto allUsers = GlobalState::getInstance().getAllUsers();
    json ambulances = json::array();
    for (const auto& [uid, u] : allUsers) {
        if (u.role == UserRole::DRIVER) {
            ambulances.push_back({
                {"id", uid},
                {"lat", u.last_location.latitude},
                {"lng", u.last_location.longitude},
                {"speed", u.last_location.speed}
            });
        }
    }
    json authResponse = {
        {"type", "AUTH_SUCCESS"},
        {"id", id},
        {"role", role_str},
        {"connectedClients", (int)allUsers.size()},
        {"activeDrivers", ambulances}
    };
    m_server.send(hdl, authResponse.dump(), websocketpp::frame::opcode::text);

    // Notify all other clients about the new connection
    json joinNotice = {
        {"type", "USER_JOINED"},
        {"id", id},
        {"role", role_str}
    };
    broadcast_except(joinNotice, hdl);
}

void WebsocketServer::handle_sos(websocketpp::connection_hdl hdl, const json& payload) {
    User* patient = GlobalState::getInstance().getUserByHdl(hdl);
    if (!patient) return;

    // Update patient location from the SOS payload
    double lat = payload.value("latitude", 0.0);
    double lng = payload.value("longitude", 0.0);
    Location patLoc;
    patLoc.latitude = lat;
    patLoc.longitude = lng;
    GlobalState::getInstance().updateUserLocation(patient->id, patLoc);

    // Create immediate Trip
    Trip trip;
    trip.trip_id = "trip_" + patient->id;
    trip.patient_id = patient->id;
    trip.state = TripState::DISPATCHED;
    GlobalState::getInstance().addTrip(trip);

    std::cout << "[SOS] Patient " << patient->id << " at " << lat << "," << lng << std::endl;

    // Broadcast SOS_ALERT to ALL connected clients (Drivers, Admins, Hospitals)
    // This is the primary event that triggers the Driver to see the patient on their map
    json sosAlert = {
        {"type", "SOS_ALERT"},
        {"patient_id", patient->id},
        {"trip_id", trip.trip_id},
        {"latitude", lat},
        {"longitude", lng}
    };
    broadcast(sosAlert);

    // Also send SOS_ACCEPTED confirmation back to the patient
    json response = {
        {"type", "SOS_ACCEPTED"},
        {"trip_id", trip.trip_id}
    };
    send_to_user(patient->id, response);
}

void WebsocketServer::handle_telemetry(websocketpp::connection_hdl hdl, const json& payload) {
    User* driver = GlobalState::getInstance().getUserByHdl(hdl);
    if (!driver || driver->role != UserRole::DRIVER) return;

    Location loc;
    loc.latitude = payload.value("latitude", 0.0);
    loc.longitude = payload.value("longitude", 0.0);
    loc.speed = payload.value("speed", 0.0);
    loc.elevation = payload.value("elevation", 0.0);
    
    GlobalState::getInstance().updateUserLocation(driver->id, loc);

    // Broadcast telemetry to all EXCEPT the sender (Driver doesn't need their own echo)
    json update = {
        {"type", "TELEMETRY_UPDATE"},
        {"driver_id", driver->id},
        {"latitude", loc.latitude},
        {"longitude", loc.longitude},
        {"speed", loc.speed},
        {"elevation", loc.elevation}
    };
    broadcast_except(update, hdl);
}

void WebsocketServer::handle_state_transition(websocketpp::connection_hdl hdl, const json& payload) {
    User* user = GlobalState::getInstance().getUserByHdl(hdl);
    if (!user) return;

    std::string trip_id = payload.value("trip_id", "");
    std::string state_str = payload.value("new_state", "");

    Trip* trip = GlobalState::getInstance().getTrip(trip_id);
    if (!trip) return;

    TripState new_state = TripState::IDLE;
    if (state_str == "ARRIVED_AT_PATIENT") new_state = TripState::ARRIVED_AT_PATIENT;
    else if (state_str == "EN_ROUTE_TO_HOSPITAL") new_state = TripState::EN_ROUTE_TO_HOSPITAL;
    else if (state_str == "COMPLETED") new_state = TripState::COMPLETED;

    // Optional: geofencing validation before transition using geo::calculate_distance
    // E.g. limit distance to < 10 meters for ARRIVED_AT_PATIENT
    
    if (StateMachine::transition(*trip, new_state)) {
        GlobalState::getInstance().updateTripState(trip_id, trip->state);
        // Broadcast successful state transition
        json response = {
            {"type", "TRIP_STATE_UPDATE"},
            {"trip_id", trip_id},
            {"new_state", state_str}
        };
        broadcast(response);
    }
}

void WebsocketServer::handle_emergency_coords(websocketpp::connection_hdl hdl, const json& payload) {
    // Broadcast updated emergency coordinates to all clients except sender
    json update = {
        {"type", "EMERGENCY_COORDS_UPDATE"},
        {"coords", payload} 
    };
    broadcast_except(update, hdl);
}

void WebsocketServer::handle_sos_status_update(websocketpp::connection_hdl hdl, const json& payload) {
    // Relay SOS status updates to all clients except sender
    json update = {
        {"type", "SOS_STATUS_UPDATE"},
        {"status", payload.value("status", "idle")},
        {"activeAmbulanceId", payload.value("activeAmbulanceId", "")},
        {"selectedHospital", payload.value("selectedHospital", "")}
    };
    broadcast_except(update, hdl);
}

void WebsocketServer::handle_map_layers_update(websocketpp::connection_hdl hdl, const json& payload) {
    // Synchronize map layers across all screens except sender
    json update = {
        {"type", "MAP_LAYERS_UPDATE"},
        {"terrain", payload.value("terrain", false)},
        {"weatherLayer", payload.value("weatherLayer", false)},
        {"trafficLayer", payload.value("trafficLayer", false)}
    };
    broadcast_except(update, hdl);
}

void WebsocketServer::handle_hospital_data_update(websocketpp::connection_hdl hdl, const json& payload) {
    // Broadcast hospital data updates except to sender
    json update = {
        {"type", "HOSPITAL_DATA_UPDATE"},
        {"hospitalData", payload}
    };
    broadcast_except(update, hdl);
}

void WebsocketServer::broadcast(const json& msg) {
    auto users = GlobalState::getInstance().getAllUsers();
    std::string payload = msg.dump();
    for (const auto& [id, user] : users) {
        m_server.send(user.hdl, payload, websocketpp::frame::opcode::text);
    }
}

void WebsocketServer::broadcast_except(const json& msg, websocketpp::connection_hdl sender) {
    auto users = GlobalState::getInstance().getAllUsers();
    std::string payload = msg.dump();
    auto sender_ptr = sender.lock().get();
    for (const auto& [id, user] : users) {
        auto user_ptr = user.hdl.lock().get();
        if (user_ptr != sender_ptr) {
            m_server.send(user.hdl, payload, websocketpp::frame::opcode::text);
        }
    }
}

void WebsocketServer::send_to_user(const std::string& user_id, const json& msg) {
    User* user = GlobalState::getInstance().getUser(user_id);
    if (user) {
        m_server.send(user->hdl, msg.dump(), websocketpp::frame::opcode::text);
    }
}
