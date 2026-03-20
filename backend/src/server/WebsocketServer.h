#pragma once
#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>
#include <nlohmann/json.hpp>

typedef websocketpp::server<websocketpp::config::asio> server;

class WebsocketServer {
public:
    WebsocketServer();
    void run(uint16_t port);

private:
    void on_open(websocketpp::connection_hdl hdl);
    void on_close(websocketpp::connection_hdl hdl);
    void on_message(websocketpp::connection_hdl hdl, server::message_ptr msg);
    
    void handle_auth(websocketpp::connection_hdl hdl, const nlohmann::json& payload);
    void handle_sos(websocketpp::connection_hdl hdl, const nlohmann::json& payload);
    void handle_accept_sos(websocketpp::connection_hdl hdl, const nlohmann::json& payload);
    void handle_telemetry(websocketpp::connection_hdl hdl, const nlohmann::json& payload);
    void handle_state_transition(websocketpp::connection_hdl hdl, const nlohmann::json& payload);
    void handle_emergency_coords(websocketpp::connection_hdl hdl, const nlohmann::json& payload);
    void handle_sos_status_update(websocketpp::connection_hdl hdl, const nlohmann::json& payload);
    void handle_map_layers_update(websocketpp::connection_hdl hdl, const nlohmann::json& payload);
    void handle_hospital_data_update(websocketpp::connection_hdl hdl, const nlohmann::json& payload);
    void handle_vitals_update(websocketpp::connection_hdl hdl, const nlohmann::json& payload);
    void handle_mission_stats_update(websocketpp::connection_hdl hdl, const nlohmann::json& payload);

    void broadcast(const nlohmann::json& msg);
    void broadcast_except(const nlohmann::json& msg, websocketpp::connection_hdl sender);
    void broadcast_fleet();
    void send_to_user(const std::string& user_id, const nlohmann::json& msg);

    server m_server;
};
