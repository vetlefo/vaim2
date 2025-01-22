import { Core } from 'cytoscape';

// Graph Types
export interface GraphNode {
  id: string;
  type: 'thought' | 'llm' | 'hpc' | 'bridge';
  data: {
    content: string;
    metadata: Record<string, unknown>;
    confidence?: number;
  };
  position?: {
    x: number;
    y: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'connection' | 'suggestion' | 'bridge';
  data?: Record<string, unknown>;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  cyInstance: Core | null;
  loading: boolean;
  error: string | null;
}

// UI Types
export interface ViewSettings {
  showLabels: boolean;
  showEdgeLabels: boolean;
  showGrid: boolean;
  zoomLevel: number;
  layout: 'force' | 'hierarchical' | 'circular';
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: string;
  disabled?: boolean;
}

export interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timeout?: number;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeSidebarTab: 'chat' | 'settings' | 'history' | null;
  activeModal: string | null;
  notifications: Notification[];
  contextMenu: ContextMenu;
  viewSettings: ViewSettings;
}

// Collaboration Types
export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
  selection?: {
    nodes: string[];
    edges: string[];
  };
  lastActive: number;
}

export interface PendingChange {
  id: string;
  type: 'node' | 'edge';
  action: 'add' | 'update' | 'delete';
  data: any;
  timestamp: number;
  userId: string;
}

export interface CollaborationState {
  connected: boolean;
  activeUsers: Record<string, User>;
  currentUser: User | null;
  userCursors: Record<string, { x: number; y: number }>;
  userSelections: Record<string, { nodes: string[]; edges: string[] }>;
  pendingChanges: PendingChange[];
  synchronizing: boolean;
  error: string | null;
}

// Root State
export interface RootState {
  graph: GraphState;
  ui: UIState;
  collaboration: CollaborationState;
}