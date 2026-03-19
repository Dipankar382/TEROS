#pragma once
#include <string>

class AIRoutingEngine {
public:
    // Returns a mocked JSON string representing a routing polyline for the demo
    static std::string calculateIdealRoute(double start_lat, double start_lon, double end_lat, double end_lon);
    
    // Simulates an AI reroute around a disaster/traffic hazard
    static std::string handleHazardReroute(const std::string& trip_id, double hazard_lat, double hazard_lon);
};
