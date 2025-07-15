import React from 'react';
import { Upload } from 'lucide-react';

interface OTAUpdateProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onUpdate: () => void;
  isLoading: boolean;
}

const OTAUpdate: React.FC<OTAUpdateProps> = ({
  selectedFile,
  onFileSelect,
  onUpdate,
  isLoading
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-600" />
        Firmware Update
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Select Firmware File
          </label>
          <input
            type="file"
            accept=".bin"
            onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-900 hover:file:bg-blue-100"
          />
        </div>
        
        <button
          onClick={onUpdate}
          disabled={isLoading || !selectedFile}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
        >
          {isLoading ? 'Uploading...' : 'Upload Firmware'}
        </button>
      </div>
    </div>
  );
};

export default OTAUpdate;