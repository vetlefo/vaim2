import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { addNode } from '@/store/slices/graphSlice';

const ChatPanel: React.FC = () => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const loading = useSelector((state: RootState) => state.graph.loading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    // Create a new thought node from the message
    dispatch(addNode({
      id: `thought-${Date.now()}`,
      type: 'thought',
      data: {
        content: message.trim(),
        label: message.trim(),
        metadata: {
          timestamp: Date.now(),
          source: 'chat'
        }
      }
    }));

    setMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* TODO: Add message history */}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 input-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!message.trim() || loading}
            className="btn-primary"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;