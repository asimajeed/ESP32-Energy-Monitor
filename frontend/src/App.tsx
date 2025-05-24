import React, { useState, useEffect } from 'react';

// Import all the smaller components (you'll create these as separate files)
import Header from './components/Header';
import StatusMessage from './components/StatusMessage';
import CurrentStatus from './components/CurrentStatus';
import GoogleSheetsLink from './components/GoogleSheetsLink';
import SettingsPanel from './components/SettingsPanel';
import QuickActions from './components/QuickActions';
import OTAUpdate from './components/OTAUpdate';
import type { StatusData, SettingsData } from './utils/types';

const PowerMeterDashboard: React.FC = () => {
  const [status, setStatus] = useState<StatusData>({ irms1: 0, irms2: 0, irms3: 0 });
  const [settings, setSettings] = useState<SettingsData>({
    hV: 230,
    cV1: 1,
    cV2: 1,
    cV3: 1,
    numms: 10,
    interval: 60
  });
  const [settingsForm, setSettingsForm] = useState<SettingsData>({
    hV: 230,
    cV1: 1,
    cV2: 1,
    cV3: 1,
    numms: 10,
    interval: 60
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // API functions
  const fetchStatus = async () => {
    try {
      const response = await fetch('/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/settings');
      const data = await response.json();
      setSettings(data);
      setSettingsForm(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSettings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        houseVoltage: settingsForm.hV.toString(),
        calibrationVal1: settingsForm.cV1.toString(),
        calibrationVal2: settingsForm.cV2.toString(),
        calibrationVal3: settingsForm.cV3.toString(),
        numMeasurements: settingsForm.numms.toString(),
        interval: settingsForm.interval.toString()
      });

      const response = await fetch('/update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });
      const result = await response.text();
      setStatusMessage(result);
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      setStatusMessage('Update failed');
      console.error('Error updating settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetWifi = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/reset-wifi', { method: 'POST' });
      const result = await response.text();
      setStatusMessage(result);
    } catch (error) {
      setStatusMessage('Reset failed');
      console.error('Error resetting WiFi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const restartDevice = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/restart', { method: 'POST' });
      const result = await response.text();
      setStatusMessage(result);
      setTimeout(() => window.location.reload(), 5000);
    } catch (error) {
      setStatusMessage('Restart failed');
      console.error('Error restarting device:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtaUpdate = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('firmware', selectedFile);
    
    try {
      const response = await fetch('/update', {
        method: 'POST',
        body: formData
      });
      const result = await response.text();
      setStatusMessage(result);
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      setStatusMessage('OTA Update failed');
      console.error('Error updating firmware:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (field: keyof SettingsData, value: number) => {
    setSettingsForm(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetchStatus();
    fetchSettings();
    
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <StatusMessage message={statusMessage} />

        <CurrentStatus status={status} voltage={settings.hV} />

        <GoogleSheetsLink />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SettingsPanel
            settings={settingsForm}
            onSettingsChange={handleSettingsChange}
            onUpdate={updateSettings}
            isLoading={isLoading}
          />

          <div className="space-y-8">
            <QuickActions
              onResetWifi={resetWifi}
              onRestart={restartDevice}
              isLoading={isLoading}
            />

            <OTAUpdate
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              onUpdate={handleOtaUpdate}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerMeterDashboard;