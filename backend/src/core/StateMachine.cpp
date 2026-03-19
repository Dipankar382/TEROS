#include "StateMachine.h"

bool StateMachine::transition(Trip& trip, TripState new_state) {
    // Strict enforced progression
    switch (trip.state) {
        case TripState::IDLE:
            if (new_state == TripState::DISPATCHED) {
                trip.state = new_state;
                return true;
            }
            break;
        case TripState::DISPATCHED:
            if (new_state == TripState::ARRIVED_AT_PATIENT) {
                trip.state = new_state;
                return true;
            }
            break;
        case TripState::ARRIVED_AT_PATIENT:
            if (new_state == TripState::EN_ROUTE_TO_HOSPITAL) {
                trip.state = new_state;
                return true;
            }
            break;
        case TripState::EN_ROUTE_TO_HOSPITAL:
            if (new_state == TripState::COMPLETED) {
                trip.state = new_state;
                return true;
            }
            break;
        case TripState::COMPLETED:
            // Terminal state
            return false;
    }
    return false;
}
