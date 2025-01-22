import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { setLoading, addNode } from '@/store/slices/graphSlice';
import { GraphNode } from '@/types/store';

const Toolbar: React.FC = () => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const loading = useSelector((state: RootState) => state.graph.loading);

  const handleExport = async () => {
    dispatch(setLoading(true));
    try {
      // TODO: Implement graph export functionality
    } catch (error) {
      console.error('Failed to export graph:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAddNode = () => {
    const cyInstance = document.getElementById('cy');
    if (!cyInstance) return;

    const rect = cyInstance.getBoundingClientRect();
    const center = {
      x: rect.width / 2,
      y: rect.height / 2
    };

    const newNode: Omit<GraphNode, 'id'> = {
      type: 'thought',
      data: {
        content: 'New Thought',
        metadata: {}
      },
      position: center
    };
    dispatch(addNode(newNode));
  };

  return (
    <div className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-2">
      {/* Add Node */}
      <button
        onClick={handleAddNode}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        title="Add Node"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Toggle Sidebar */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        title={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {sidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          )}
        </svg>
      </button>

      <div className="h-6 w-px bg-gray-200" />

      {/* Graph Actions */}
      <div className="flex items-center gap-2">
        {/* Add Node */}
        <button
          className="btn-secondary"
          disabled={loading}
          title="Add Node"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {/* Connect Nodes */}
        <button
          className="btn-secondary"
          disabled={loading}
          title="Connect Nodes"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h8m-4-4v8"
            />
          </svg>
        </button>

        {/* Delete Selected */}
        <button
          className="btn-secondary"
          disabled={loading}
          title="Delete Selected"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <div className="h-6 w-px bg-gray-200" />

      {/* View Actions */}
      <div className="flex items-center gap-2">
        {/* Zoom In */}
        <button
          className="btn-secondary"
          disabled={loading}
          title="Zoom In"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </button>

        {/* Zoom Out */}
        <button
          className="btn-secondary"
          disabled={loading}
          title="Zoom Out"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
            />
          </svg>
        </button>

        {/* Fit View */}
        <button
          className="btn-secondary"
          disabled={loading}
          title="Fit View"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-5V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
            />
          </svg>
        </button>
      </div>

      <div className="h-6 w-px bg-gray-200" />

      {/* Export/Import */}
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary"
          onClick={handleExport}
          disabled={loading}
          title="Export Graph"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;