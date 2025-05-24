import React from 'react';
import { ExternalLink } from 'lucide-react';

const GoogleSheetsLink: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="text-center">
        <a 
          href={import.meta.env.VITE_SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
          View Google Sheet
        </a>
      </div>
    </div>
  );
};

export default GoogleSheetsLink;