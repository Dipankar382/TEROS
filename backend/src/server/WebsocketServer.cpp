#include "WebsocketServer.h"
#include "../core/GlobalState.h"
#include "../core/StateMachine.h"
#include "../geo/Telemetry.h"
#include "../routing/AIRoutingEngine.h"
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
}

void WebsocketServer::handle_sos(websocketpp::connection_hdl hdl, const json& payload) {
    User* patient = GlobalState::getInstance().getUserByHdl(hdl);
    if (!patient) return;

    // Create immediate Trip
    Trip trip;
    trip.trip_id = "trip_" + patient->id;
    trip.patient_id = patient->id;
    trip.state = TripState::DISPATCHED; 
    
    GlobalState::getInstance().addTrip(trip);

    // AI computes initial route
    std::string route = AIRoutingEngine::calculateIdealRoute(
        patient->last_location.latitude, patient->last_location.longitude,
        // Mock hospital coordinates
        40.7128, -74.0060 
    );

    json response = {
        {"type", "SOS_ACCEPTED"},
        {"trip_id", trip.trip_id},
        {"route", json::parse(route)}
    };
    send_to_user(patient->id, response);
    broadcast(response); // Alert admins and hospitals
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

    // Broadcast telemetry
    json update = {
        {"type", "TELEMETRY_UPDATE"},
        {"driver_id", driver->id},
        {"latitude", loc.latitude},
        {"longitude", loc.longitude},
        {"speed", loc.speed},
        {"elevation", loc.elevation}
    };
    broadcast(update);
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

void WebsocketServer::broadcast(const json& msg) {
    auto users = GlobalState::getInstance().getAllUsers();
    std::string payload = msg.dump();
    for (const auto& [id, user] : users) {
        m_server.send(user.hdl, payload, websocketpp::frame::opcode::text);
    }
}

void WebsocketServer::send_to_user(const std::string& user_id, const json& msg) {
    User* user = GlobalState::getInstance().getUser(user_id);
    if (user) {
        m_server.send(user->hdl, msg.dump(), websocketpp::frame::opcode::text);
    }
}
