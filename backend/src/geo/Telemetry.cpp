#include "Telemetry.h"
#include <cmath>

namespace geo {

constexpr double EARTH_RADIUS_METERS = 6371000.0;
constexpr double PI = 3.14159265358979323846;

double to_radians(double degrees) {
    return degrees * PI / 180.0;
}

double calculate_distance(double lat1, double lon1, double lat2, double lon2) {
    double dLat = to_radians(lat2 - lat1);
    double dLon = to_radians(lon2 - lon1);
    
    double a = std::sin(dLat / 2.0) * std::sin(dLat / 2.0) +
               std::cos(to_radians(lat1)) * std::cos(to_radians(lat2)) *
               std::sin(dLon / 2.0) * std::sin(dLon / 2.0);
               
    double c = 2.0 * std::atan2(std::sqrt(a), std::sqrt(1.0 - a));
    return EARTH_RADIUS_METERS * c;
}

} // namespace geo
