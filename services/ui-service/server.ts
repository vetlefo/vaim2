import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  methods: ['GET', 'POST'],
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    methods: ['GET', 'POST'],
  },
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle user joining
  socket.on('user:join', (user) => {
    connectedUsers.set(socket.id, user);
    socket.broadcast.emit('user:joined', { ...user, id: socket.id });
    
    // Send currently connected users to the new user
    const users = Array.from(connectedUsers.entries()).map(([id, userData]) => ({
      ...userData,
      id,
    }));
    socket.emit('users:list', users);
  });

  // Handle cursor movement
  socket.on('user:cursor', ({ position }) => {
    socket.broadcast.emit('user:cursor', {
      userId: socket.id,
      ...position,
    });
  });

  // Handle selection changes
  socket.on('user:selection', ({ selection }) => {
    socket.broadcast.emit('user:selection', {
      userId: socket.id,
      selection,
    });
  });

  // Handle graph changes
  socket.on('graph:change', (change) => {
    socket.broadcast.emit('graph:change', {
      userId: socket.id,
      ...change,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    io.emit('user:left', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});