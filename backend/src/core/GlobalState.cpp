#include "GlobalState.h"

GlobalState& GlobalState::getInstance() {
    static GlobalState instance;
    return instance;
}

void GlobalState::addUser(const std::string& id, UserRole role, websocketpp::connection_hdl hdl) {
    std::lock_guard<std::mutex> lock(state_mutex);
    User user;
    user.id = id;
    user.role = role;
    user.hdl = hdl;
    user.is_online = true;
    users[id] = user;
    hdl_to_userid[hdl.lock().get()] = id;
}

void GlobalState::removeUser(const std::string& id) {
    std::lock_guard<std::mutex> lock(state_mutex);
    if (users.find(id) != users.end()) {
        auto hdl_ptr = users[id].hdl.lock().get();
        hdl_to_userid.erase(hdl_ptr);
        users.erase(id);
    }
}

User* GlobalState::getUser(const std::string& id) {
    std::lock_guard<std::mutex> lock(state_mutex);
    if (users.find(id) != users.end()) {
        return &users[id];
    }
    return nullptr;
}

User* GlobalState::getUserByHdl(websocketpp::connection_hdl hdl) {
    std::lock_guard<std::mutex> lock(state_mutex);
    auto it = hdl_to_userid.find(hdl.lock().get());
    if (it != hdl_to_userid.end()) {
        if (users.find(it->second) != users.end()) {
            return &users[it->second];
        }
    }
    return nullptr;
}

std::unordered_map<std::string, User> GlobalState::getAllUsers() {
    std::lock_guard<std::mutex> lock(state_mutex);
    return users;
}

void GlobalState::updateUserLocation(const std::string& id, const Location& loc) {
    std::lock_guard<std::mutex> lock(state_mutex);
    if (users.find(id) != users.end()) {
        users[id].last_location = loc;
    }
}

void GlobalState::addTrip(const Trip& trip) {
    std::lock_guard<std::mutex> lock(state_mutex);
    trips[trip.trip_id] = trip;
}

Trip* GlobalState::getTrip(const std::string& trip_id) {
    std::lock_guard<std::mutex> lock(state_mutex);
    if (trips.find(trip_id) != trips.end()) {
        return &trips[trip_id];
    }
    return nullptr;
}

void GlobalState::updateTripState(const std::string& trip_id, TripState new_state) {
    std::lock_guard<std::mutex> lock(state_mutex);
    if (trips.find(trip_id) != trips.end()) {
        trips[trip_id].state = new_state;
    }
}

std::unordered_map<std::string, Trip> GlobalState::getActiveTrips() {
    std::lock_guard<std::mutex> lock(state_mutex);
    return trips;
}
