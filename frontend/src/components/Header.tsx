import React, { useEffect, useState } from "react";
import { Power, Sun, Moon } from "lucide-react";

const Header: React.FC = () => {
  let stored = localStorage.getItem("darkEnabled");
  const [darkEnabled, setDarkEnabled] = useState(
    stored === null ? window.matchMedia("(prefers-color-scheme: dark)").matches : stored === "true"
  );
  useEffect(() => {
    if (darkEnabled) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);
  const toggleDark = () => {
    const newDark = !darkEnabled;
    setDarkEnabled(newDark);
    localStorage.setItem("darkEnabled", newDark ? "true" : "false");
    if (newDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="bg-theme-main relative text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-3">
          <Power className="w-8 h-8" />
          <h1 className="text-2xl font-bold">ESP32 Power Meter</h1>
        </div>
      </div>
      <div className="right-0 top-0 absolute h-20 w-10 flex justify-center items-center">
        <div
          className="p-2 rounded-xl bg-blue-300/25 sm:mr-6 text-shadow-amber-600 dark:text-indigo-100 transition-colors shadow-2xl"
          onClick={toggleDark}
        >
          {!darkEnabled ? <Sun /> : <Moon />}
        </div>
      </div>
    </header>
  );
};

export default Header;
