import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setSidebarTab } from '@/store/slices/uiSlice';
import ChatPanel from './ChatPanel';
import SettingsPanel from './SettingsPanel';
import HistoryPanel from './HistoryPanel';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const activeTab = useSelector((state: RootState) => state.ui.activeSidebarTab);

  const tabs = [
    { id: 'chat', label: 'Chat', icon: 'chat-bubble-left' },
    { id: 'settings', label: 'Settings', icon: 'cog' },
    { id: 'history', label: 'History', icon: 'clock' },
  ] as const;

  const renderPanel = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatPanel />;
      case 'settings':
        return <SettingsPanel />;
      case 'history':
        return <HistoryPanel />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed top-0 left-0 h-screen w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => dispatch(setSidebarTab(id))}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === id
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className={`heroicon-${icon} w-5 h-5 mx-auto mb-1`} />
            <span className="block text-center">{label}</span>
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {renderPanel()}
      </div>
    </aside>
  );
};

export default Sidebar;