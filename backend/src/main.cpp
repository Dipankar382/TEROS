#include <iostream>
#include "server/WebsocketServer.h"

#include <cstdlib>

int main() {
    std::cout << "[INIT] Enterprise Ambulance Dashboard Live Server" << std::endl;
    std::cout << "[INIT] Starting high-performance C++ WebSocket backend..." << std::endl;
    
    WebsocketServer server;
    const char* port_env = std::getenv("PORT");
    uint16_t port = 9001;
    if (port_env && port_env[0] != '\0') {
        try {
            port = std::stoi(port_env);
        } catch (...) {
            std::cerr << "[INIT] Invalid PORT env var, defaulting to 9001\n";
        }
    }
    
    // Run on assigned port
    server.run(port);
    
    return 0;
}
