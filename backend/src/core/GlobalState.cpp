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
    hdl_to_userid[hdl] = id;
}

void GlobalState::removeUser(const std::string& id) {
    std::lock_guard<std::mutex> lock(state_mutex);
    auto it = users.find(id);
    if (it != users.end()) {
        hdl_to_userid.erase(it->second.hdl);
        users.erase(it);
    }
}

std::optional<User> GlobalState::getUser(const std::string& id) {
    std::lock_guard<std::mutex> lock(state_mutex);
    auto it = users.find(id);
    if (it != users.end()) {
        return it->second;
    }
    return std::nullopt;
}

std::optional<User> GlobalState::getUserByHdl(websocketpp::connection_hdl hdl) {
    std::lock_guard<std::mutex> lock(state_mutex);
    auto it_id = hdl_to_userid.find(hdl);
    if (it_id != hdl_to_userid.end()) {
        auto it_user = users.find(it_id->second);
        if (it_user != users.end()) {
            return it_user->second;
        }
    }
    return std::nullopt;
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

std::optional<Trip> GlobalState::getTrip(const std::string& trip_id) {
    std::lock_guard<std::mutex> lock(state_mutex);
    auto it = trips.find(trip_id);
    if (it != trips.end()) {
        return it->second;
    }
    return std::nullopt;
}

void GlobalState::updateTripState(const std::string& trip_id, TripState new_state) {
    std::lock_guard<std::mutex> lock(state_mutex);
    auto it = trips.find(trip_id);
    if (it != trips.end()) {
        it->second.state = new_state;
    }
}

void GlobalState::updateTrip(const Trip& trip) {
    std::lock_guard<std::mutex> lock(state_mutex);
    trips[trip.trip_id] = trip;
}

std::unordered_map<std::string, Trip> GlobalState::getActiveTrips() {
    std::lock_guard<std::mutex> lock(state_mutex);
    return trips;
}
