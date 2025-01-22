import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setTheme, updateViewSettings } from '@/store/slices/uiSlice';

const SettingsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const viewSettings = useSelector((state: RootState) => state.ui.viewSettings);

  const layoutOptions = [
    { value: 'force', label: 'Force-Directed' },
    { value: 'hierarchical', label: 'Hierarchical' },
    { value: 'circular', label: 'Circular' },
  ] as const;

  return (
    <div className="p-4 space-y-6">
      {/* Theme Settings */}
      <section>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
        <div className="flex gap-4">
          <button
            onClick={() => dispatch(setTheme('light'))}
            className={`px-4 py-2 rounded-lg ${
              theme === 'light'
                ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => dispatch(setTheme('dark'))}
            className={`px-4 py-2 rounded-lg ${
              theme === 'dark'
                ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Dark
          </button>
        </div>
      </section>

      {/* View Settings */}
      <section>
        <h3 className="text-lg font-medium text-gray-900 mb-4">View Settings</h3>
        <div className="space-y-4">
          {/* Layout Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layout Type
            </label>
            <select
              value={viewSettings.layout}
              onChange={(e) =>
                dispatch(
                  updateViewSettings({
                    layout: e.target.value as typeof viewSettings.layout,
                  })
                )
              }
              className="input-primary w-full"
            >
              {layoutOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Settings */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={viewSettings.showLabels}
                onChange={(e) =>
                  dispatch(
                    updateViewSettings({ showLabels: e.target.checked })
                  )
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Show Node Labels</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={viewSettings.showEdgeLabels}
                onChange={(e) =>
                  dispatch(
                    updateViewSettings({ showEdgeLabels: e.target.checked })
                  )
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Show Edge Labels</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={viewSettings.showGrid}
                onChange={(e) =>
                  dispatch(
                    updateViewSettings({ showGrid: e.target.checked })
                  )
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Show Grid</span>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPanel;