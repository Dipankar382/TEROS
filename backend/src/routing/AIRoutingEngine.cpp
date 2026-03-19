#include "AIRoutingEngine.h"
#include <nlohmann/json.hpp>

using nlohmann::json;

std::string AIRoutingEngine::calculateIdealRoute(double start_lat, double start_lon, double end_lat, double end_lon) {
    // For the Live Demo mode, we mock the routing engine's output.
    // In a production C++ backend, this would interface with OSRM or a custom graph traversal.
    json route = {
        {"type", "FeatureCollection"},
        {"features", json::array({
            {
                {"type", "Feature"},
                {"geometry", {
                    {"type", "LineString"},
                    {"coordinates", {
                        {start_lon, start_lat},
                        // Mocking an intermediate point
                        {(start_lon + end_lon) / 2.0, (start_lat + end_lat) / 2.0},
                        {end_lon, end_lat}
                    }}
                }}
            }
        })}
    };
    return route.dump();
}

std::string AIRoutingEngine::handleHazardReroute(const std::string& trip_id, double hazard_lat, double hazard_lon) {
    // Generates a new "optimal" path avoiding the hazard
    json notification = {
        {"event", "AI_REROUTE"},
        {"trip_id", trip_id},
        {"reason", "Hazard avoidance detected."},
        {"new_route", {
            // Mock new coordinates
            {hazard_lon + 0.001, hazard_lat + 0.001}
        }}
    };
    return notification.dump();
}
