import React, { useState } from 'react';
import { Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface EnergyData {
  totalKwh: number;
  phase1Kwh: number;
  phase2Kwh: number;
  phase3Kwh: number;
  startDate: string;
  endDate: string;
}

const EnergyCalculator: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [energyData, setEnergyData] = useState<EnergyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEnergyData = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (startDate > endDate) {
      setError('Start date must be before end date');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });

      const response = await fetch(`/energy-consumption?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch energy data');
      }
      
      const data = await response.json();
      setEnergyData(data);
    } catch (error) {
      console.error('Error fetching energy data:', error);
      setError('Failed to fetch energy data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = () => {
    setEnergyData(null);
    setError('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-600" />
        Energy Consumption Calculator
      </h2>
      
      <div className="space-y-6">
        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Select start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'Select end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={fetchEnergyData}
            disabled={isLoading || !startDate || !endDate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Calculating...' : 'Calculate Energy'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={resetData}
            disabled={isLoading}
          >
            Reset
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Energy Data Display */}
        {energyData && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Energy Consumption: {format(new Date(energyData.startDate), 'MMM dd')} - {format(new Date(energyData.endDate), 'MMM dd, yyyy')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Consumption */}
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {energyData.totalKwh.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total kWh</div>
              </div>

              {/* Phase 1 */}
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-xl font-bold text-red-600 mb-1">
                  {energyData.phase1Kwh.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Phase 1 kWh</div>
              </div>

              {/* Phase 2 */}
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-xl font-bold text-yellow-600 mb-1">
                  {energyData.phase2Kwh.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Phase 2 kWh</div>
              </div>

              {/* Phase 3 */}
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-xl font-bold text-green-600 mb-1">
                  {energyData.phase3Kwh.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Phase 3 kWh</div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Duration:</span> {
                    Math.ceil((new Date(energyData.endDate).getTime() - new Date(energyData.startDate).getTime()) / (1000 * 60 * 60 * 24))
                  } days
                </div>
                <div>
                  <span className="font-medium">Avg Daily:</span> {
                    (energyData.totalKwh / Math.ceil((new Date(energyData.endDate).getTime() - new Date(energyData.startDate).getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)
                  } kWh/day
                </div>
                <div>
                  <span className="font-medium">Peak Phase:</span> Phase {
                    [energyData.phase1Kwh, energyData.phase2Kwh, energyData.phase3Kwh].indexOf(
                      Math.max(energyData.phase1Kwh, energyData.phase2Kwh, energyData.phase3Kwh)
                    ) + 1
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnergyCalculator;