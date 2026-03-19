#pragma once
#include <unordered_map>
#include <string>
#include <mutex>
#include "../models/User.h"
#include "../models/Trip.h"
#include <websocketpp/common/connection_hdl.hpp>

class GlobalState {
public:
    static GlobalState& getInstance();

    // User Management
    void addUser(const std::string& id, UserRole role, websocketpp::connection_hdl hdl);
    void removeUser(const std::string& id);
    User* getUser(const std::string& id);
    User* getUserByHdl(websocketpp::connection_hdl hdl);
    std::unordered_map<std::string, User> getAllUsers();
    
    // Updates
    void updateUserLocation(const std::string& id, const Location& loc);

    // Trip Management 
    void addTrip(const Trip& trip);
    Trip* getTrip(const std::string& trip_id);
    void updateTripState(const std::string& trip_id, TripState new_state);
    std::unordered_map<std::string, Trip> getActiveTrips();

private:
    GlobalState() = default;
    
    std::mutex state_mutex;
    std::unordered_map<std::string, User> users;
    std::unordered_map<void*, std::string> hdl_to_userid;
    std::unordered_map<std::string, Trip> trips;
};
