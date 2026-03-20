#pragma once
#include "../models/Trip.h"

class StateMachine {
public:
    static bool transition(Trip& trip, TripState new_state);
};
