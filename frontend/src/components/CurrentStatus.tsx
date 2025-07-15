import React, { useEffect, useState } from "react";
import { Power } from "lucide-react";
import PhaseCard from "./PhaseCard";
import type { StatusData } from "../utils/types";
import axios from "axios";

interface CurrentStatusProps {
  voltage: number;
}

const CurrentStatus: React.FC<CurrentStatusProps> = ({ voltage }) => {
  const [status, setStatus] = useState<StatusData>({ irms1: 0, irms2: 0, irms3: 0 });
  // API functions
  const fetchStatus = async () => {
    try {
      const { data } = await axios.get("/status");
      setStatus(data);
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  })

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Power className="w-5 h-5 text-blue-600" />
        Current Status
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PhaseCard phase={1} current={status.irms1} voltage={voltage} />
        <PhaseCard phase={2} current={status.irms2} voltage={voltage} />
        <PhaseCard phase={3} current={status.irms3} voltage={voltage} />
      </div>
    </div>
  );
};

export default CurrentStatus;
