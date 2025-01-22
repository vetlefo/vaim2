import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import cytoscape, { Core } from 'cytoscape';
import { RootState } from '@/store';
import { setCyInstance } from '@/store/slices/graphSlice';
import { useGraphLayout } from '@/hooks/useGraphLayout';
import { useGraphEvents } from '@/hooks/useGraphEvents';
import { useCollaboration } from '@/hooks/useCollaboration';

const GraphCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  
  const nodes = useSelector((state: RootState) => state.graph.nodes);
  const edges = useSelector((state: RootState) => state.graph.edges);
  const layout = useSelector((state: RootState) => state.ui.viewSettings.layout);
  
  const { applyLayout } = useGraphLayout();
  const { setupGraphEvents } = useGraphEvents();
  const { setupCollaboration } = useCollaboration();

  // Initialize Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#0ea5e9',
            'label': 'data(label)',
            'color': '#1e293b',
            'font-size': '12px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '40px',
            'height': '40px',
            'border-width': '2px',
            'border-color': '#e2e8f0',
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
            'text-rotation': 'autorotate',
            'text-margin-y': -10
          }
        },
        {
          selector: '.highlighted',
          style: {
            'background-color': '#0284c7',
            'border-color': '#0ea5e9',
            'border-width': '3px',
            'width': '45px',
            'height': '45px'
          }
        },
        {
          selector: '.selected',
          style: {
            'background-color': '#0369a1',
            'border-color': '#0284c7',
            'border-width': '3px',
            'width': '45px',
            'height': '45px'
          }
        }
      ],
      layout: {
        name: 'grid'
      },
      wheelSensitivity: 0.2,
      minZoom: 0.2,
      maxZoom: 3
    });

    dispatch(setCyInstance(cyRef.current));
    setupGraphEvents(cyRef.current);
    setupCollaboration(cyRef.current);

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        dispatch(setCyInstance(null));
      }
    };
  }, [dispatch, setupGraphEvents, setupCollaboration]);

  // Update graph elements when data changes
  useEffect(() => {
    if (!cyRef.current) return;

    cyRef.current.elements().remove();
    const elements: cytoscape.ElementDefinition[] = [
      ...nodes.map(node => ({
        data: { ...node.data, id: node.id },
        group: 'nodes' as const
      })),
      ...edges.map(edge => ({
        data: { ...edge.data, id: edge.id, source: edge.source, target: edge.target },
        group: 'edges' as const
      }))
    ];
    cyRef.current.add(elements);

    applyLayout(cyRef.current, layout);
  }, [nodes, edges, layout, applyLayout]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-gray-50"
      data-testid="graph-canvas"
    />
  );
};

export default GraphCanvas;