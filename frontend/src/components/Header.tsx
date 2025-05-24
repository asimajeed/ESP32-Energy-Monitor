import React from 'react';
import { Power } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-3">
          <Power className="w-8 h-8" />
          <h1 className="text-2xl font-bold">ESP32 Power Meter</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;