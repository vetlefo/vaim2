import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import GraphCanvas from '@/components/GraphCanvas';
import Sidebar from '@/components/Sidebar';
import Toolbar from '@/components/Toolbar';
import ContextMenu from '@/components/ContextMenu';
import NotificationStack from '@/components/NotificationStack';
import Modal from '@/components/Modal';

const App: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const activeModal = useSelector((state: RootState) => state.ui.activeModal);

  return (
    <div className={`app ${theme} min-h-screen`}>
      <div className="flex h-screen overflow-hidden">
        {/* Main content area */}
        <main className={`flex-1 flex flex-col transition-all ${
          sidebarOpen ? 'ml-80' : ''
        }`}>
          {/* Toolbar */}
          <Toolbar />

          {/* Graph canvas */}
          <div className="flex-1 relative">
            <GraphCanvas />
          </div>
        </main>

        {/* Sidebar */}
        <Sidebar />

        {/* Floating UI elements */}
        <ContextMenu />
        <NotificationStack />

        {/* Modal container */}
        {activeModal && <Modal />}
      </div>
    </div>
  );
};

export default App;