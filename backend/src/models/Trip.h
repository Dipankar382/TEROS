#pragma once
#include <string>

enum class TripState {
    IDLE,
    DISPATCHED,
    ARRIVED_AT_PATIENT,
    EN_ROUTE_TO_HOSPITAL,
    COMPLETED
};

struct Trip {
    std::string trip_id;
    std::string patient_id;
    std::string driver_id;
    std::string hospital_id;
    TripState state = TripState::IDLE;
    long long start_time = 0;
    double estimated_eta_seconds = 0.0;
};
