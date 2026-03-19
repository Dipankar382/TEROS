#pragma once
#include <string>
#include <websocketpp/common/connection_hdl.hpp>

enum class UserRole {
    ADMIN,
    HOSPITAL,
    PATIENT,
    DRIVER,
    UNKNOWN
};

struct Location {
    double latitude = 0.0;
    double longitude = 0.0;
    double elevation = 0.0;
    double speed = 0.0;
    double bearing = 0.0;
    long long timestamp = 0;
};

struct User {
    std::string id;
    UserRole role = UserRole::UNKNOWN;
    websocketpp::connection_hdl hdl;
    Location last_location;
    bool is_online = false;
    std::string current_trip_id; // If involved in an active trip
};
