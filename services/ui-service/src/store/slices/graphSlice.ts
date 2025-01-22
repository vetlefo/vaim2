import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Core } from 'cytoscape';
import { GraphState, GraphNode, GraphEdge } from '@/types/store';

const initialState: GraphState = {
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],
  cyInstance: null,
  loading: false,
  error: null,
};

const graphSlice = createSlice({
  name: 'graph',
  initialState,
  reducers: {
    setCyInstance: (state, action: PayloadAction<Core | null>) => {
      state.cyInstance = action.payload;
    },
    addNode: (state, action: PayloadAction<Omit<GraphNode, 'id'>>) => {
      const newNode: GraphNode = {
        id: crypto.randomUUID(),
        ...action.payload
      };
      state.nodes.push(newNode);
    },
    removeNode: (state, action: PayloadAction<string>) => {
      state.nodes = state.nodes.filter(node => node.id !== action.payload);
      state.edges = state.edges.filter(
        edge => edge.source !== action.payload && edge.target !== action.payload
      );
    },
    addEdge: (state, action: PayloadAction<GraphEdge>) => {
      state.edges.push(action.payload);
    },
    removeEdge: (state, action: PayloadAction<string>) => {
      state.edges = state.edges.filter(edge => edge.id !== action.payload);
    },
    setSelectedNodes: (state, action: PayloadAction<string[]>) => {
      state.selectedNodes = action.payload;
    },
    setSelectedEdges: (state, action: PayloadAction<string[]>) => {
      state.selectedEdges = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateNodeData: (
      state,
      action: PayloadAction<{ id: string; data: Partial<GraphNode['data']> }>
    ) => {
      const node = state.nodes.find(n => n.id === action.payload.id);
      if (node) {
        node.data = { ...node.data, ...action.payload.data };
      }
    },
    clearSelection: (state) => {
      state.selectedNodes = [];
      state.selectedEdges = [];
    },
  },
});

export const {
  setCyInstance,
  addNode,
  removeNode,
  addEdge,
  removeEdge,
  setSelectedNodes,
  setSelectedEdges,
  setLoading,
  setError,
  updateNodeData,
  clearSelection,
} = graphSlice.actions;

export default graphSlice.reducer;