import React from 'react';
import { Settings } from 'lucide-react';
import type { SettingsData } from '../utils/types';

interface SettingsPanelProps {
  settings: SettingsData;
  onSettingsChange: (field: keyof SettingsData, value: number) => void;
  onUpdate: () => void;
  isLoading: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onUpdate,
  isLoading
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5 text-blue-600" />
        Settings
      </h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            House Voltage (V)
            <input
              type="number"
              value={settings.hV}
              onChange={(e) => onSettingsChange('hV', parseFloat(e.target.value) || 0)}
              step="0.1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          
          <label className="block text-sm font-medium text-gray-700">
            Measurements Count
            <input
              type="number"
              value={settings.numms}
              onChange={(e) => onSettingsChange('numms', parseInt(e.target.value) || 0)}
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
        </div>
        
        <label className="block text-sm font-medium text-gray-700">
          Interval (seconds)
          <input
            type="number"
            value={settings.interval}
            onChange={(e) => onSettingsChange('interval', parseInt(e.target.value) || 0)}
            min="1"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </label>
        
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((cal) => (
            <label key={cal} className="block text-sm font-medium text-gray-700">
              Calibration {cal}
              <input
                type="number"
                value={settings[`cV${cal}` as keyof SettingsData]}
                onChange={(e) => onSettingsChange(`cV${cal}` as keyof SettingsData, parseFloat(e.target.value) || 0)}
                step="any"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </label>
          ))}
        </div>
        
        <button
          onClick={onUpdate}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
        >
          {isLoading ? 'Updating...' : 'Update Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;