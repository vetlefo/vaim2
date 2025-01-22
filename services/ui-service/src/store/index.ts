import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import graphReducer from './slices/graphSlice';
import uiReducer from './slices/uiSlice';
import collaborationReducer from './slices/collaborationSlice';
import { GraphState, UIState, CollaborationState } from '@/types/store';

// Define the store's state type
export interface StoreState {
  graph: GraphState;
  ui: UIState;
  collaboration: CollaborationState;
}

export const store = configureStore({
  reducer: {
    graph: graphReducer,
    ui: uiReducer,
    collaboration: collaborationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in Cytoscape instances
        ignoredActions: ['graph/setCyInstance'],
        ignoredPaths: ['graph.cyInstance'],
      },
    }),
});

export type RootState = StoreState;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;