import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "./components/Header";
import CurrentStatus from "./components/CurrentStatus";
import ExportRawData from "./components/ExportRawData";
import SettingsPanel from "./components/SettingsPanel";
import QuickActions from "./components/QuickActions";
import OTAUpdate from "./components/OTAUpdate";
import EnergyTrends from "./components/EnergyTrends";
import type { SettingsData } from "./utils/types";
import { toast } from "sonner";

const App: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    hV: 230,
    cV1: 1,
    cV2: 1,
    cV3: 1,
    numms: 10,
    interval: 60,
  });
  const [settingsForm, setSettingsForm] = useState<SettingsData>({ ...settings });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get("/settings");
      const isValidSettings =
        data && data.hV && data.cV1 && data.cV2 && data.cV3 && data.numms && data.interval;

      setSettings(isValidSettings ? data : settings);
      setSettingsForm(isValidSettings ? data : settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
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
        interval: settingsForm.interval.toString(),
      });

      const { data } = await axios.post("/update-settings", params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      toast.success(data);
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      toast.error("Update failed");
      console.error("Error updating settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetWifi = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.post("/reset-wifi");
      toast.success(data);
    } catch (error) {
      toast.error("Reset failed");
      console.error("Error resetting WiFi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const restartDevice = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.post("/restart");
      toast.success(data);
      setTimeout(() => window.location.reload(), 5000);
    } catch (error) {
      toast.error("Restart failed");
      console.error("Error restarting device:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtaUpdate = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("firmware", selectedFile);

    try {
      const { data } = await axios.post("/update", formData);
      toast.success(data);
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      toast.error("OTA Update failed");
      console.error("Error updating firmware:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (field: keyof SettingsData, value: number) => {
    setSettingsForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetchSettings();

  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <CurrentStatus voltage={settings.hV} />
        <EnergyTrends />
        <ExportRawData />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SettingsPanel
            settings={settingsForm}
            onSettingsChange={handleSettingsChange}
            onUpdate={updateSettings}
            isLoading={isLoading}
          />

          <div className="space-y-8">
            <QuickActions onResetWifi={resetWifi} onRestart={restartDevice} isLoading={isLoading} />

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

export default App;
