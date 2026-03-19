FROM ubuntu:22.04

# Avoid tzdata interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the entire backend directory into the container
COPY . .

# Build the high-performance C++ WebSocket server
RUN cmake -B build -S . -DCMAKE_POLICY_VERSION_MINIMUM=3.5 \
    && cmake --build build

# Expose the WebSocket port based on Render/Fly default or explicitly 9001
ENV PORT=9001
EXPOSE 9001

# Render automatically maps the external PORT to the internal one, so our server usually listens on 9001
CMD ["./build/live_server"]
