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
    void handle_telemetry(websocketpp::connection_hdl hdl, const nlohmann::json& payload);
    void handle_state_transition(websocketpp::connection_hdl hdl, const nlohmann::json& payload);

    void broadcast(const nlohmann::json& msg);
    void send_to_user(const std::string& user_id, const nlohmann::json& msg);

    server m_server;
};
