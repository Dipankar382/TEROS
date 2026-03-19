const http = require('http');
const { Server } = require('socket.io');

const PORT = 9001;
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for the hackathon demo
    methods: ["GET", "POST"]
  }
});

const rateLimits = new Map();

io.on('connection', (socket) => {
  console.log('Device connected:', socket.id);

  // Relay all events to all other connected clients with rate protection
  socket.on('teros_sync', (data) => {
    const now = Date.now();
    const key = `${socket.id}_${data.type}`;
    const lastTime = rateLimits.get(key) || 0;
    
    // Allow telemetry every 300ms, others immediately or with slight guard
    const minDelay = data.type === 'DRIVER_TELEMETRY' ? 300 : 50;
    
    if (now - lastTime > minDelay) {
      rateLimits.set(key, now);
      socket.broadcast.emit('teros_sync', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Device disconnected:', socket.id);
    // Cleanup rate limits for this socket
    for (const key of rateLimits.keys()) {
      if (key.startsWith(socket.id)) rateLimits.delete(key);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Teros Sync Server running on port ${PORT}`);
  console.log(`Connect your devices to this machine's IP on port ${PORT}`);
});
