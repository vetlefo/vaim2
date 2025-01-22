import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Core, EventObject } from 'cytoscape';
import { setSelectedNodes, setSelectedEdges } from '@/store/slices/graphSlice';
import { showContextMenu, hideContextMenu } from '@/store/slices/uiSlice';
import { updateUserSelection } from '@/store/slices/collaborationSlice';

export const useGraphEvents = () => {
  const dispatch = useDispatch();

  const setupGraphEvents = useCallback((cy: Core) => {
    // Selection events
    cy.on('select', 'node, edge', (event: EventObject) => {
      const selectedNodes = cy.nodes(':selected').map(node => node.id());
      const selectedEdges = cy.edges(':selected').map(edge => edge.id());
      
      dispatch(setSelectedNodes(selectedNodes));
      dispatch(setSelectedEdges(selectedEdges));
      dispatch(updateUserSelection({
        userId: 'current-user', // This should come from auth context
        selection: { nodes: selectedNodes, edges: selectedEdges }
      }));
    });

    cy.on('unselect', 'node, edge', () => {
      const selectedNodes = cy.nodes(':selected').map(node => node.id());
      const selectedEdges = cy.edges(':selected').map(edge => edge.id());
      
      dispatch(setSelectedNodes(selectedNodes));
      dispatch(setSelectedEdges(selectedEdges));
      dispatch(updateUserSelection({
        userId: 'current-user', // This should come from auth context
        selection: { nodes: selectedNodes, edges: selectedEdges }
      }));
    });

    // Context menu events
    cy.on('cxttap', 'node', (event) => {
      const node = event.target;
      const position = event.renderedPosition;
      
      dispatch(showContextMenu({
        x: position.x,
        y: position.y,
        items: [
          {
            id: 'edit',
            label: 'Edit Node',
            icon: 'edit',
            action: 'EDIT_NODE'
          },
          {
            id: 'delete',
            label: 'Delete Node',
            icon: 'trash',
            action: 'DELETE_NODE'
          },
          {
            id: 'expand',
            label: 'Expand Node',
            icon: 'expand',
            action: 'EXPAND_NODE'
          }
        ]
      }));
    });

    cy.on('cxttap', 'edge', (event) => {
      const edge = event.target;
      const position = event.renderedPosition;
      
      dispatch(showContextMenu({
        x: position.x,
        y: position.y,
        items: [
          {
            id: 'edit',
            label: 'Edit Edge',
            icon: 'edit',
            action: 'EDIT_EDGE'
          },
          {
            id: 'delete',
            label: 'Delete Edge',
            icon: 'trash',
            action: 'DELETE_EDGE'
          }
        ]
      }));
    });

    // Hide context menu when clicking on background
    cy.on('tap', (event) => {
      if (event.target === cy) {
        dispatch(hideContextMenu());
      }
    });

    // Prevent text selection during drag
    cy.on('mousedown', () => {
      document.body.classList.add('grabbing');
    });

    cy.on('mouseup', () => {
      document.body.classList.remove('grabbing');
    });

    // Clean up event listeners
    return () => {
      cy.removeAllListeners();
    };
  }, [dispatch]);

  return {
    setupGraphEvents
  };
};