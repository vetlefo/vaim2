import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { hideContextMenu } from '@/store/slices/uiSlice';

const ContextMenu: React.FC = () => {
  const dispatch = useDispatch();
  const { visible, x, y, items } = useSelector((state: RootState) => state.ui.contextMenu);

  if (!visible) return null;

  const handleItemClick = (action: string) => {
    // TODO: Implement context menu actions
    console.log('Context menu action:', action);
    dispatch(hideContextMenu());
  };

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
      style={{
        left: x,
        top: y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleItemClick(item.action)}
          disabled={item.disabled}
          className={`w-full px-4 py-2 text-left text-sm ${
            item.disabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          } flex items-center gap-2`}
        >
          {item.icon && (
            <span className={`heroicon-${item.icon} w-4 h-4`} />
          )}
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;