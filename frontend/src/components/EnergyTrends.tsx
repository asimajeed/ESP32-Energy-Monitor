import React, { useState } from "react";
import {
  Calendar,
  TrendingUp,
  Zap,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import axios from "axios";

// Using native Date formatting instead of date-fns

interface TrendData {
  total_energy_kWh: number;
  total_cost_PKR: number;
  on_peak_energy_kWh: number;
  off_peak_energy_kWh: number;
  on_peak_cost_PKR: number;
  off_peak_cost_PKR: number;
  hourly_avg_kWh: {
    labels: string[];
    data: number[];
  };
  daily_kWh: {
    labels: string[];
    data: number[];
  };
  daily_cost_PKR: {
    labels: string[];
    data: number[];
  };
  weekday_avg_kWh: {
    labels: string[];
    data: number[];
  };
  peak_usage_hours: {
    labels: string[];
    data: number[];
  };
}

const EnergyTrends: React.FC = () => {
  const [startDate, setStartDate] = useState<string>("2025-03-10");
  const [endDate, setEndDate] = useState<string>("2025-04-10");
  const [baseRate, setBaseRate] = useState<number>(35);
  const [peakRate, setPeakRate] = useState<number>(40);
  const [peakStart, setPeakStart] = useState<string>("18:30");
  const [peakEnd, setPeakEnd] = useState<string>("22:30");
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["overview"]));

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const fetchTrendData = async () => {
    if (!startDate || !endDate || !baseRate) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        start_date: `${startDate}T00:00:00Z`,
        end_date: `${endDate}T00:00:00Z`,
        base_rate: baseRate.toString(),
        ...(peakRate && { peak_rate: peakRate.toString() }),
        ...(peakStart && { peak_start: peakStart }),
        ...(peakEnd && { peak_end: peakEnd }),
      });
      ``;
      const { data } = await axios.get(
        `https://uglbyk70z2.execute-api.ap-southeast-1.amazonaws.com/trend?${params.toString()}`
      );
      setTrendData(data);
    } catch (error) {
      console.error("Error fetching trend data:", error);
      setError("Failed to fetch trend data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = () => {
    setTrendData(null);
    setError("");
    setExpandedSections(new Set(["overview"]));
  };

  const formatChartData = (labels: string[], data: number[]) => {
    return labels.map((label, index) => ({
      name: label,
      value: data[index],
    }));
  };

  const AccordionSection = ({
    id,
    title,
    icon: Icon,
    children,
  }: {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.has(id);

    return (
      <div className="border border-gray-200 rounded-lg mb-4">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {isExpanded && <div className="p-4 bg-white rounded-b-lg">{children}</div>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-600" />
        Energy Trends Analysis
      </h2>

      {/* Input Form */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate (PKR) *</label>
            <input
              type="number"
              value={baseRate}
              onChange={(e) => setBaseRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peak Rate (PKR)</label>
            <input
              type="number"
              value={peakRate}
              onChange={(e) => setPeakRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peak Start Time</label>
            <input
              type="time"
              value={peakStart}
              onChange={(e) => setPeakStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peak End Time</label>
            <input
              type="time"
              value={peakEnd}
              onChange={(e) => setPeakEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchTrendData}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Analyzing..." : "Analyze Trends"}
          </button>
          <button
            onClick={resetData}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {trendData && (
        <div className="space-y-4">
          {/* Overview Section */}
          <AccordionSection id="overview" title="Overview & Summary" icon={Zap}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {trendData.total_energy_kWh.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Energy (kWh)</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  ₨{trendData.total_cost_PKR.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Total Cost (PKR)</div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {trendData.on_peak_energy_kWh.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Peak Energy (kWh)</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {trendData.off_peak_energy_kWh.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Off-Peak Energy (kWh)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Peak Hours Cost</h4>
                <div className="text-xl font-bold text-red-600">₨{trendData.on_peak_cost_PKR.toFixed(0)}</div>
                <div className="text-sm text-gray-600">
                  {((trendData.on_peak_cost_PKR / trendData.total_cost_PKR) * 100).toFixed(1)}% of total cost
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Off-Peak Hours Cost</h4>
                <div className="text-xl font-bold text-blue-600">
                  ₨{trendData.off_peak_cost_PKR.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">
                  {((trendData.off_peak_cost_PKR / trendData.total_cost_PKR) * 100).toFixed(1)}% of total cost
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* Daily Trends */}
          <AccordionSection id="daily" title="Daily Energy & Cost Trends" icon={Calendar}>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Daily Energy Consumption (kWh)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatChartData(trendData.daily_kWh.labels, trendData.daily_kWh.data)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} kWh`, "Energy"]} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: "#3B82F6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Daily Cost (PKR)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatChartData(trendData.daily_cost_PKR.labels, trendData.daily_cost_PKR.data)}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₨${Number(value).toFixed(0)}`, "Cost"]} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ fill: "#10B981" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* Hourly & Weekly Patterns */}
          <AccordionSection id="patterns" title="Usage Patterns" icon={BarChart3}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Average Hourly Consumption</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={formatChartData(trendData.hourly_avg_kWh.labels, trendData.hourly_avg_kWh.data)}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(3)} kWh`, "Avg Energy"]} />
                      <Bar dataKey="value" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Average by Day of Week</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={formatChartData(trendData.weekday_avg_kWh.labels, trendData.weekday_avg_kWh.data)}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} kWh`, "Avg Energy"]} />
                      <Bar dataKey="value" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* Peak Usage Hours */}
          <AccordionSection id="peak" title="Peak Usage Analysis" icon={Clock}>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Highest Usage Hours</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trendData.peak_usage_hours.labels.map((label, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 text-center"
                  >
                    <div className="text-lg font-bold text-red-600 mb-1">
                      {trendData.peak_usage_hours.data[index].toFixed(2)} kWh
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(label).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Rank #{index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </AccordionSection>
        </div>
      )}
    </div>
  );
};

export default EnergyTrends;
