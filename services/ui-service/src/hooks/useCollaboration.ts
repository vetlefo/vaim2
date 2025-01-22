import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Core } from 'cytoscape';
import { io, Socket } from 'socket.io-client';
import { RootState } from '@/store';
import {
  setConnectionStatus,
  updateUserPresence,
  removeUser,
  updateUserCursor,
  updateUserSelection,
} from '@/store/slices/collaborationSlice';

let socket: Socket | null = null;

export const useCollaboration = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.collaboration.currentUser);

  const initializeSocket = useCallback(() => {
    if (socket) return;

    socket = io('http://localhost:4000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      dispatch(setConnectionStatus(true));
      if (currentUser) {
        socket?.emit('user:join', currentUser);
      }
    });

    socket.on('disconnect', () => {
      dispatch(setConnectionStatus(false));
    });

    socket.on('user:joined', (user) => {
      dispatch(updateUserPresence(user));
    });

    socket.on('user:left', (userId) => {
      dispatch(removeUser(userId));
    });

    socket.on('user:cursor', ({ userId, position }) => {
      dispatch(updateUserCursor({ userId, ...position }));
    });

    socket.on('user:selection', ({ userId, selection }) => {
      dispatch(updateUserSelection({ userId, selection }));
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [dispatch, currentUser]);

  const setupCollaboration = useCallback((cy: Core) => {
    initializeSocket();

    // Handle cursor movement
    const throttledEmitCursor = throttle((position: { x: number; y: number }) => {
      socket?.emit('user:cursor', { position });
    }, 50);

    cy.container()?.addEventListener('mousemove', (e) => {
      const bounds = cy.container()?.getBoundingClientRect();
      if (!bounds) return;

      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      throttledEmitCursor({ x, y });
    });

    // Handle selection changes
    cy.on('select unselect', () => {
      const selection = {
        nodes: cy.nodes(':selected').map(node => node.id()),
        edges: cy.edges(':selected').map(edge => edge.id()),
      };
      socket?.emit('user:selection', { selection });
    });

    return () => {
      cy.removeListener('select unselect');
      cy.container()?.removeEventListener('mousemove', throttledEmitCursor);
    };
  }, [initializeSocket]);

  return {
    setupCollaboration,
  };
};

// Utility function for throttling
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}