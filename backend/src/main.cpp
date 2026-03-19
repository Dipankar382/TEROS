#include <iostream>
#include "server/WebsocketServer.h"

#include <cstdlib>

int main() {
    std::cout << "[INIT] Enterprise Ambulance Dashboard Live Server" << std::endl;
    std::cout << "[INIT] Starting high-performance C++ WebSocket backend..." << std::endl;
    
    WebsocketServer server;
    const char* port_env = std::getenv("PORT");
    uint16_t port = port_env ? std::stoi(port_env) : 9001;
    
    // Run on assigned port
    server.run(port);
    
    return 0;
}
