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

io.on('connection', (socket) => {
  console.log('Device connected:', socket.id);

  // Relay all events to all other connected clients
  socket.on('teros_sync', (data) => {
    // console.log('Relaying:', data.type);
    socket.broadcast.emit('teros_sync', data);
  });

  socket.on('disconnect', () => {
    console.log('Device disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Teros Sync Server running on port ${PORT}`);
  console.log(`Connect your devices to this machine's IP on port ${PORT}`);
});
