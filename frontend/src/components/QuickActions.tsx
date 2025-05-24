import React from 'react';
import { Wifi, RotateCcw } from 'lucide-react';

interface QuickActionsProps {
  onResetWifi: () => void;
  onRestart: () => void;
  isLoading: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onResetWifi,
  onRestart,
  isLoading
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
      
      <div className="space-y-3">
        <button
          onClick={onResetWifi}
          disabled={isLoading}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Wifi className="w-4 h-4" />
          Reset WiFi
        </button>
        
        <button
          onClick={onRestart}
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Restart Device
        </button>
      </div>
    </div>
  );
};

export default QuickActions;