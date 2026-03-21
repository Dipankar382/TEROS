#include "WebsocketServer.h"
#include "../core/GlobalState.h"
#include "../core/StateMachine.h"
#include "../geo/Telemetry.h"
#include <iostream>
#include <chrono>
#include <iomanip>

void log_with_time(const std::string& msg) {
    auto now = std::chrono::system_clock::now();
    auto in_time_t = std::chrono::system_clock::to_time_t(now);
    std::tm* time_ptr = std::localtime(&in_time_t);
    if (time_ptr) {
        std::cout << "[" << std::put_time(time_ptr, "%Y-%m-%d %X") << "] " << msg << std::endl;
    } else {
        std::cout << "[Unknown Time] " << msg << std::endl;
    }
}


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
    log_with_time("[WebsocketServer] Connection opened");
}

void WebsocketServer::on_close(websocketpp::connection_hdl hdl) {
    log_with_time("[WebsocketServer] Connection closed");
    auto user = GlobalState::getInstance().getUserByHdl(hdl);
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
            broadcast_fleet(); // Update everyone when a new role joins
        } else if (type == "SOS_REQUEST") {
            handle_sos(hdl, payload);
        } else if (type == "ACCEPT_SOS") {
            handle_accept_sos(hdl, payload);
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
        } else if (type == "VITALS_UPDATE") {
            handle_vitals_update(hdl, payload);
        } else if (type == "MISSION_STATS_UPDATE") {
            handle_mission_stats_update(hdl, payload);
        } else if (type == "HEARTBEAT") {
            // Echo back to keep connection alive
            json pong = {{"type", "HEARTBEAT_PONG"}};
            m_server.send(hdl, pong.dump(), websocketpp::frame::opcode::text);
        }
    } catch (const nlohmann::json::exception& e) {
        std::cerr << "[WebsocketServer] JSON exception: " << e.what() << std::endl;
        log_with_time("[ERROR] JSON processing failed: " + std::string(e.what()));
    } catch (const std::exception& e) {
        std::cerr << "[WebsocketServer] Standard exception: " << e.what() << std::endl;
        log_with_time("[ERROR] Internal server error: " + std::string(e.what()));
    } catch (...) {
        std::cerr << "[WebsocketServer] Unknown exception caught" << std::endl;
        log_with_time("[ERROR] An unknown error occurred in message handler");
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
            double lat = std::isfinite(u.last_location.latitude) ? u.last_location.latitude : 0.0;
            double lng = std::isfinite(u.last_location.longitude) ? u.last_location.longitude : 0.0;
            double speed = std::isfinite(u.last_location.speed) ? u.last_location.speed : 0.0;
            
            ambulances.push_back({
                {"id", uid},
                {"lat", lat},
                {"lng", lng},
                {"speed", speed}
            });
        }
    }
    json authResponse = {
        {"type", "AUTH_SUCCESS"},
        {"id", id},
        {"role", role_str},
        {"connectedClients", (int)allUsers.size()},
        {"activeDrivers", ambulances},
        {"activeTrips", json::array()}
    };
    
    auto trips = GlobalState::getInstance().getActiveTrips();
    json tripsArray = json::array();
    for (const auto& [tid, t] : trips) {
        tripsArray.push_back({
            {"trip_id", t.trip_id},
            {"patient_id", t.patient_id},
            {"driver_id", t.driver_id},
            {"state", (int)t.state},
            {"patient_lat", t.patient_lat},
            {"patient_lng", t.patient_lng},
            {"condition", t.condition}
        });
    }
    authResponse["activeTrips"] = tripsArray;
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
    auto patient = GlobalState::getInstance().getUserByHdl(hdl);
    if (!patient) return;

    // Update patient location from the SOS payload
    double lat = payload.value("latitude", 0.0);
    double lng = payload.value("longitude", 0.0);
    Location patLoc;
    patLoc.latitude = lat;
    patLoc.longitude = lng;
    GlobalState::getInstance().updateUserLocation(patient->id, patLoc);

    // Create primary trip state
    Trip trip;
    trip.trip_id = "trip_" + patient->id;
    trip.patient_id = patient->id;
    trip.patient_lat = lat;
    trip.patient_lng = lng;
    trip.condition = payload.value("condition", "critical");
    trip.state = TripState::DISPATCHED;

    // --- Automated Allocation Logic (FIND NEAREST BUSY DRIVER) ---
    std::string nearest_driver_id = "";
    double min_dist = 1e18;
    auto users = GlobalState::getInstance().getAllUsers();
    
    for (const auto& [uid, user] : users) {
        if (user.role == UserRole::DRIVER && user.is_online) {
            double dist = geo::calculate_distance(lat, lng, user.last_location.latitude, user.last_location.longitude);
            if (dist < min_dist) {
                min_dist = dist;
                nearest_driver_id = uid;
            }
        }
    }

    if (!nearest_driver_id.empty()) {
        trip.driver_id = nearest_driver_id;
        log_with_time("[AUTO-ALLOCATE] Assigned Driver " + nearest_driver_id + " to SOS from " + patient->id);
    } else {
        log_with_time("[AUTO-ALLOCATE] No available drivers found for SOS from " + patient->id);
    }

    GlobalState::getInstance().addTrip(trip);
    log_with_time("[SOS] Patient " + patient->id + " triggered at coordinates.");

    // Broadcast SOS_ALERT to everyone
    json sosAlert = {
        {"type", "SOS_ALERT"},
        {"patient_id", patient->id},
        {"trip_id", trip.trip_id},
        {"latitude", lat},
        {"longitude", lng},
        {"condition", trip.condition}
    };
    broadcast(sosAlert);

    // If assigned, broadcast SOS_ASSIGNED
    if (!trip.driver_id.empty()) {
        json assigned = {
            {"type", "SOS_ASSIGNED"},
            {"driver_id", trip.driver_id},
            {"trip_id", trip.trip_id}
        };
        broadcast(assigned);
    }
    
    broadcast_fleet(); 

    // Confirm to patient
    json response = {
        {"type", "SOS_ACCEPTED"},
        {"trip_id", trip.trip_id}
    };
    m_server.send(hdl, response.dump(), websocketpp::frame::opcode::text);
}

void WebsocketServer::handle_accept_sos(websocketpp::connection_hdl hdl, const json& payload) {
    auto driver = GlobalState::getInstance().getUserByHdl(hdl);
    if (!driver || driver->role != UserRole::DRIVER) return;

    std::string trip_id = payload.value("trip_id", "");
    log_with_time("[DISPATCH] Driver " + driver->id + " accepted SOS " + trip_id);

    // Persist the assignment in GlobalState
    auto trip = GlobalState::getInstance().getTrip(trip_id);
    if (trip) {
        trip->driver_id = driver->id;
        trip->state = TripState::DISPATCHED; 
        GlobalState::getInstance().updateTrip(*trip);
        
        // Notify everyone who is responding to which trip
        json assigned = {
            {"type", "SOS_ASSIGNED"},
            {"driver_id", driver->id},
            {"trip_id", trip_id}
        };
        broadcast(assigned);
    } else {
        log_with_time("[ERROR] Trip " + trip_id + " not found while accepting SOS");
    }
}

void WebsocketServer::handle_telemetry(websocketpp::connection_hdl hdl, const json& payload) {
    auto driver = GlobalState::getInstance().getUserByHdl(hdl);
    if (!driver || driver->role != UserRole::DRIVER) return;

    Location loc;
    loc.latitude = payload.value("latitude", 0.0);
    loc.longitude = payload.value("longitude", 0.0);
    loc.speed = payload.value("speed", 0.0);
    loc.elevation = payload.value("elevation", 0.0);
    
    GlobalState::getInstance().updateUserLocation(driver->id, loc);

    // Broadcast telemetry to all EXCEPT the sender (Driver doesn't need their own echo)
    // Sanitize telemetry before broadcasting to prevent JSON serialization errors (NaN/Inf)
    double b_lat = std::isfinite(loc.latitude) ? loc.latitude : 0.0;
    double b_lng = std::isfinite(loc.longitude) ? loc.longitude : 0.0;
    double b_speed = std::isfinite(loc.speed) ? loc.speed : 0.0;
    double b_elev = std::isfinite(loc.elevation) ? loc.elevation : 0.0;

    json update = {
        {"type", "TELEMETRY_UPDATE"},
        {"driver_id", driver->id},
        {"latitude", b_lat},
        {"longitude", b_lng},
        {"speed", b_speed},
        {"elevation", b_elev}
    };
    broadcast_except(update, hdl);
}

void WebsocketServer::handle_state_transition(websocketpp::connection_hdl hdl, const json& payload) {
    auto user = GlobalState::getInstance().getUserByHdl(hdl);
    if (!user) return;

    std::string trip_id = payload.value("trip_id", "");
    std::string state_str = payload.value("new_state", "");

    auto trip = GlobalState::getInstance().getTrip(trip_id);
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
    // Relay updated emergency coordinates to all clients except sender
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
        {"selectedHospital", payload.value("selectedHospital", "")},
        {"goldenHour", payload.value("goldenHour", 3600)},
        {"criticalEventActive", payload.value("criticalEventActive", false)}
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
        {"hospitalData", payload.value("hospitalData", json::object())}
    };
    broadcast_except(update, hdl);
}

void WebsocketServer::handle_vitals_update(websocketpp::connection_hdl hdl, const json& payload) {
    json update = {
        {"type", "VITALS_UPDATE"},
        {"heartRate", payload.value("heartRate", 70)},
        {"spo2", payload.value("spo2", 98)}
    };
    broadcast_except(update, hdl);
}

void WebsocketServer::handle_mission_stats_update(websocketpp::connection_hdl hdl, const json& payload) {
    json update = {
        {"type", "MISSION_STATS_UPDATE"},
        {"goldenHour", payload.value("goldenHour", 3600)},
        {"criticalEventActive", payload.value("criticalEventActive", false)},
        {"ambulanceSpeed", payload.value("ambulanceSpeed", 0)}
    };
    broadcast_except(update, hdl);
}

void WebsocketServer::broadcast(const json& msg) {
    auto users = GlobalState::getInstance().getAllUsers();
    std::string payload = msg.dump();
    for (const auto& [id, user] : users) {
        if (user.hdl.expired()) continue;
        try {
            m_server.send(user.hdl, payload, websocketpp::frame::opcode::text);
        } catch (...) {
            // Stale connection, will be cleaned up by on_close
        }
    }
}

void WebsocketServer::broadcast_except(const json& msg, websocketpp::connection_hdl sender) {
    auto users = GlobalState::getInstance().getAllUsers();
    std::string payload = msg.dump();
    for (const auto& [id, user] : users) {
        if (user.hdl.expired()) continue;
        try {
            // Robust check for same connection handle
            bool is_sender = !user.hdl.owner_before(sender) && !sender.owner_before(user.hdl);
            if (!is_sender) {
                m_server.send(user.hdl, payload, websocketpp::frame::opcode::text);
            }
        } catch (...) {
            // Ignore failed send to stale handle
        }
    }
}

void WebsocketServer::broadcast_fleet() {
    auto users = GlobalState::getInstance().getAllUsers();
    json ambulances = json::array();
    for (const auto& [id, user] : users) {
        if (user.role == UserRole::DRIVER) {
            double f_lat = std::isfinite(user.last_location.latitude) ? user.last_location.latitude : 0.0;
            double f_lng = std::isfinite(user.last_location.longitude) ? user.last_location.longitude : 0.0;
            
            ambulances.push_back({
                {"id", user.id},
                {"name", "Live Unit " + user.id.substr(user.id.length() > 4 ? user.id.length()-4 : 0)},
                {"lat", f_lat},
                {"lng", f_lng},
                {"status", "available"} // Future: track via TripState
            });
        }
    }
    
    json fleetMsg = {
        {"type", "FLEET_UPDATE"},
        {"ambulances", ambulances}
    };
    broadcast(fleetMsg);
}

void WebsocketServer::send_to_user(const std::string& user_id, const nlohmann::json& msg) {
    auto user = GlobalState::getInstance().getUser(user_id);
    if (user) {
        m_server.send(user->hdl, msg.dump(), websocketpp::frame::opcode::text);
    }
}
