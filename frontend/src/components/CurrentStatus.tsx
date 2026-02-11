import React, { useEffect, useRef, useState } from "react";
import { Power } from "lucide-react";
import PhaseCard from "./PhaseCard";
import type { StatusData } from "../utils/types";

interface CurrentStatusProps {
  voltage: number;
}

const CurrentStatus: React.FC<CurrentStatusProps> = ({ voltage }) => {
  const [status, setStatus] = useState<StatusData>({ irms1: 0, irms2: 0, irms3: 0 });
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connect = () => {
      const es = new EventSource("/events");
      esRef.current = es;

      es.addEventListener("status", (e: MessageEvent) => {
        try {
          const data: StatusData = JSON.parse(e.data);
          setStatus(data);
          setConnected(true);
        } catch {
          console.error("Failed to parse SSE data:", e.data);
        }
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Reconnect after 3 s if the connection drops
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      esRef.current?.close();
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Power className="w-5 h-5 text-blue-600" />
        Current Status
        <span
          className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
            connected
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
          }`}
        >
          {connected ? "● Live" : "○ Connecting…"}
        </span>
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
