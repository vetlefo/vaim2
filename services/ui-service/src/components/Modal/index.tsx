import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { closeModal } from '@/store/slices/uiSlice';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const ModalContent: React.FC<ModalProps> = ({ title, children, onClose }) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

const Modal: React.FC = () => {
  const dispatch = useDispatch();
  const activeModal = useSelector((state: RootState) => state.ui.activeModal);

  const handleClose = () => {
    dispatch(closeModal());
  };

  if (!activeModal) return null;

  // Render different modal content based on activeModal type
  const renderModalContent = () => {
    switch (activeModal) {
      case 'node-details':
        return (
          <ModalContent title="Node Details" onClose={handleClose}>
            {/* TODO: Implement node details form */}
            <p>Node details form goes here</p>
          </ModalContent>
        );
      case 'edge-details':
        return (
          <ModalContent title="Edge Details" onClose={handleClose}>
            {/* TODO: Implement edge details form */}
            <p>Edge details form goes here</p>
          </ModalContent>
        );
      case 'settings':
        return (
          <ModalContent title="Settings" onClose={handleClose}>
            {/* TODO: Implement settings form */}
            <p>Settings form goes here</p>
          </ModalContent>
        );
      default:
        return null;
    }
  };

  return renderModalContent();
};

export default Modal;