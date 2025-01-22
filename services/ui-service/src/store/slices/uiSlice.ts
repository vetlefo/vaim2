import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, ContextMenuItem, Notification, ViewSettings } from '@/types/store';

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
  activeSidebarTab: null,
  activeModal: null,
  notifications: [],
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    items: []
  },
  viewSettings: {
    showLabels: true,
    showEdgeLabels: false,
    showGrid: true,
    zoomLevel: 1,
    layout: 'force'
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarTab: (state, action: PayloadAction<'chat' | 'settings' | 'history' | null>) => {
      state.activeSidebarTab = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      state.notifications.push({
        id: Date.now().toString(),
        ...action.payload
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    showContextMenu: (
      state,
      action: PayloadAction<{
        x: number;
        y: number;
        items: ContextMenuItem[];
      }>
    ) => {
      state.contextMenu = {
        visible: true,
        x: action.payload.x,
        y: action.payload.y,
        items: action.payload.items
      };
    },
    hideContextMenu: (state) => {
      state.contextMenu.visible = false;
      state.contextMenu.items = [];
    },
    updateViewSettings: (state, action: PayloadAction<Partial<ViewSettings>>) => {
      state.viewSettings = {
        ...state.viewSettings,
        ...action.payload
      };
    }
  }
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarTab,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  showContextMenu,
  hideContextMenu,
  updateViewSettings
} = uiSlice.actions;

export default uiSlice.reducer;