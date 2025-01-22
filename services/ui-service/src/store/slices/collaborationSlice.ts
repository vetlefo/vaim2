import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CollaborationState, User, PendingChange } from '@/types/store';

const initialState: CollaborationState = {
  connected: false,
  activeUsers: {},
  currentUser: null,
  userCursors: {},
  userSelections: {},
  pendingChanges: [],
  synchronizing: false,
  error: null
};

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    updateUserPresence: (state, action: PayloadAction<User>) => {
      const user = action.payload;
      state.activeUsers[user.id] = {
        ...user,
        lastActive: Date.now()
      };
    },
    removeUser: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      delete state.activeUsers[userId];
      delete state.userCursors[userId];
      delete state.userSelections[userId];
    },
    updateUserCursor: (
      state,
      action: PayloadAction<{ userId: string; x: number; y: number }>
    ) => {
      const { userId, x, y } = action.payload;
      state.userCursors[userId] = { x, y };
      if (state.activeUsers[userId]) {
        state.activeUsers[userId].cursor = { x, y };
        state.activeUsers[userId].lastActive = Date.now();
      }
    },
    updateUserSelection: (
      state,
      action: PayloadAction<{
        userId: string;
        selection: { nodes: string[]; edges: string[] };
      }>
    ) => {
      const { userId, selection } = action.payload;
      state.userSelections[userId] = selection;
      if (state.activeUsers[userId]) {
        state.activeUsers[userId].selection = selection;
        state.activeUsers[userId].lastActive = Date.now();
      }
    },
    addPendingChange: (
      state,
      action: PayloadAction<Omit<PendingChange, 'timestamp'>>
    ) => {
      state.pendingChanges.push({
        ...action.payload,
        timestamp: Date.now()
      });
    },
    removePendingChange: (state, action: PayloadAction<string>) => {
      state.pendingChanges = state.pendingChanges.filter(
        change => change.id !== action.payload
      );
    },
    setSynchronizing: (state, action: PayloadAction<boolean>) => {
      state.synchronizing = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  setConnectionStatus,
  setCurrentUser,
  updateUserPresence,
  removeUser,
  updateUserCursor,
  updateUserSelection,
  addPendingChange,
  removePendingChange,
  setSynchronizing,
  setError,
  clearError
} = collaborationSlice.actions;

export default collaborationSlice.reducer;