cmake_minimum_required(VERSION 3.14)
project(LiveServerBackend)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

# Set up nlohmann_json
FetchContent_Declare(json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG v3.11.2)
FetchContent_MakeAvailable(json)

# Set up ASIO (standalone)
FetchContent_Declare(asio
  GIT_REPOSITORY https://github.com/chriskohlhoff/asio.git
  GIT_TAG asio-1-28-0)
FetchContent_MakeAvailable(asio)
add_library(asio INTERFACE)
target_include_directories(asio INTERFACE ${asio_SOURCE_DIR}/asio/include)
target_compile_definitions(asio INTERFACE ASIO_STANDALONE)

# Set up websocketpp
FetchContent_Declare(websocketpp
  GIT_REPOSITORY https://github.com/zaphoyd/websocketpp.git
  GIT_TAG 0.8.2)
FetchContent_MakeAvailable(websocketpp)

add_executable(live_server
    src/main.cpp
    src/server/WebsocketServer.cpp
    src/core/StateMachine.cpp
    src/core/GlobalState.cpp
    src/routing/AIRoutingEngine.cpp
    src/geo/Telemetry.cpp
)

target_link_libraries(live_server PRIVATE nlohmann_json::nlohmann_json asio)
target_include_directories(live_server PRIVATE src ${websocketpp_SOURCE_DIR})

find_package(Threads REQUIRED)
target_link_libraries(live_server PRIVATE Threads::Threads)
