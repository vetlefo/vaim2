import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface HistoryItem {
  id: string;
  timestamp: number;
  type: 'node_added' | 'edge_added' | 'node_updated' | 'edge_updated' | 'node_deleted' | 'edge_deleted';
  data: {
    id: string;
    type: string;
    content?: string;
    source?: string;
    target?: string;
  };
}

const HistoryPanel: React.FC = () => {
  // TODO: Add history state to store and implement history tracking
  const history: HistoryItem[] = [];
  const loading = useSelector((state: RootState) => state.graph.loading);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getActionText = (item: HistoryItem) => {
    switch (item.type) {
      case 'node_added':
        return 'Added node';
      case 'edge_added':
        return 'Added connection';
      case 'node_updated':
        return 'Updated node';
      case 'edge_updated':
        return 'Updated connection';
      case 'node_deleted':
        return 'Deleted node';
      case 'edge_deleted':
        return 'Deleted connection';
      default:
        return 'Unknown action';
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No history available yet.
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {/* Timeline dot */}
            <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {getActionText(item)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>

              {/* Details */}
              <div className="mt-1 text-sm text-gray-600">
                {item.data.content ? (
                  <p className="truncate">{item.data.content}</p>
                ) : item.data.source && item.data.target ? (
                  <p>
                    Between nodes {item.data.source} and {item.data.target}
                  </p>
                ) : (
                  <p>ID: {item.data.id}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPanel;