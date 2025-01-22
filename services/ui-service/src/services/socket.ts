import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import {
  setConnectionStatus,
  updateUserPresence,
  removeUser,
  updateUserCursor,
  updateUserSelection,
} from '@/store/slices/collaborationSlice';

// Initialize socket connection
const socket: Socket = io('http://localhost:4000', {
  transports: ['websocket'],
  autoConnect: true,
});

// Connection events
socket.on('connect', () => {
  store.dispatch(setConnectionStatus(true));
  const currentUser = store.getState().collaboration.currentUser;
  if (currentUser) {
    socket.emit('user:join', currentUser);
  }
});

socket.on('disconnect', () => {
  store.dispatch(setConnectionStatus(false));
});

// User presence events
socket.on('user:joined', (user) => {
  store.dispatch(updateUserPresence(user));
});

socket.on('user:left', (userId) => {
  store.dispatch(removeUser(userId));
});

// Real-time collaboration events
socket.on('user:cursor', ({ userId, position }) => {
  store.dispatch(updateUserCursor({ userId, ...position }));
});

socket.on('user:selection', ({ userId, selection }) => {
  store.dispatch(updateUserSelection({ userId, selection }));
});

// Export socket instance
export default socket;

// Helper functions for emitting events
export const emitCursorPosition = (position: { x: number; y: number }) => {
  socket.emit('user:cursor', { position });
};

export const emitSelection = (selection: { nodes: string[]; edges: string[] }) => {
  socket.emit('user:selection', { selection });
};

export const emitGraphChange = (change: {
  type: 'node' | 'edge';
  action: 'add' | 'update' | 'delete';
  data: any;
}) => {
  socket.emit('graph:change', change);
};

// Cleanup function
export const cleanup = () => {
  socket.disconnect();
};