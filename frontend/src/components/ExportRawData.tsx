import React, { useState } from "react";
import { Download, DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { apiClient } from "@/lib/apiClientInstance";

const ExportRawData: React.FC = () => {
  const today = new Date();
  const tzOffsetMs = today.getTimezoneOffset() * 60 * 1000;
  // today.setTime(today.getTime() - today.getTimezoneOffset() * 60 * 1000);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const [startDateTime, setStartDateTime] = useState(
    new Date(
      new Date(currentYear, currentMonth <= 0 ? 12 : currentMonth - 1, 10, 0, 0).getTime() - tzOffsetMs
    )
      .toISOString()
      .slice(0, -8)
  );
  const [endDateTime, setEndDateTime] = useState(
    new Date(new Date(currentYear, currentMonth, 9, 23, 59).getTime() - tzOffsetMs).toISOString().slice(0, -8)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastExportInfo, setLastExportInfo] = useState<string>("");
  const formatDateTimeToUTC = (dateTimeValue: string): string => {
    if (!dateTimeValue) return "";
    return dateTimeValue + "Z";
  };

  const downloadCSV = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const exportData = async () => {
    if (!startDateTime || !endDateTime) {
      setError("Please select both start and end date/time");
      return;
    }

    if (new Date(startDateTime) > new Date(endDateTime)) {
      setError("Start date/time must be before end date/time");
      return;
    }

    setIsLoading(true);
    setError("");
    setLastExportInfo("");

    try {
      const params = new URLSearchParams({
        start_date: formatDateTimeToUTC(startDateTime),
        end_date: formatDateTimeToUTC(endDateTime),
      });

      const { data } = await apiClient.get(`/data?${params.toString()}`);

      // Download the CSV data
      downloadCSV(data, "PowerRaw.csv");

      // Set success message
      const startDate = new Date(startDateTime).toLocaleString();
      const endDate = new Date(endDateTime).toLocaleString();
      setLastExportInfo(`Successfully exported data from ${startDate} to ${endDate}`);
    } catch (error) {
      console.error("Error fetching energy data:", error);
      if (axios.isAxiosError(error)) {
        setError(`Failed to fetch energy data: ${error.response?.statusText || error.message}`);
      } else {
        setError("Failed to fetch energy data. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStartDateTime("");
    setEndDateTime("");
    setError("");
    setLastExportInfo("");
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <DatabaseZap className="w-5 h-5 text-yellow-600" />
        Export Raw Data
      </h2>

      <div className="space-y-6">
        {/* DateTime Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Start Date & Time</label>
            <input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">End Date & Time</label>
            <input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={exportData}
            disabled={isLoading || !startDateTime || !endDateTime}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isLoading ? "Exporting..." : "Export CSV"}
          </Button>

          <Button variant="outline" onClick={resetForm} disabled={isLoading}>
            Reset
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {lastExportInfo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              {lastExportInfo}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportRawData;
