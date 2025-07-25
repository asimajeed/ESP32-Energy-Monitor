import React from 'react';

interface PhaseCardProps {
  phase: number;
  current: number;
  voltage: number;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ phase, current, voltage }) => {
  const calculatePower = (irms: number) => (irms * voltage).toFixed(0);

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-gray-700 dark:text-gray-100 text-center">Phase {phase}</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300 ">Power:</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {calculatePower(current ?? 0)}
            </span>
            <span className="text-sm text-gray-500">W</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300 ">Current:</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {current?.toFixed(2) || '0.00'}
            </span>
            <span className="text-sm text-gray-500">A</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseCard;