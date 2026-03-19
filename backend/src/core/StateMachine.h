#pragma once
#include "../models/Trip.h"
#include <string>

class StateMachine {
public:
    static bool transition(Trip& trip, TripState new_state);
};
