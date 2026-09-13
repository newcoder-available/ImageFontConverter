'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, FileCode } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onImageSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndProcessFile = (file: File) => {
    setError(null);
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a supported image format (PNG, JPG, JPEG, or WEBP).');
      return;
    }

    // Max 15MB
    if (file.size > 15 * 1024 * 1024) {
      setError('Image file is too large. Maximum supported size is 15MB.');
      return;
    }

    onImageSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative w-full border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]'
            : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/70'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
          disabled={disabled}
        />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10">
          <UploadCloud className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
        </div>

        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
          Drag & Drop your image here
        </h3>
        <p className="text-sm text-slate-400 max-w-md mb-4">
          Upload any screenshot, gaming UI, banner, menu, or photo containing text to automatically translate and replace fonts seamlessly.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          {['PNG', 'JPG', 'JPEG', 'WEBP'].map((fmt) => (
            <span
              key={fmt}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700/80"
            >
              .{fmt.toLowerCase()}
            </span>
          ))}
          <span className="text-xs text-slate-500">Up to 15MB</span>
        </div>

        <button
          type="button"
          disabled={disabled}
          className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-sm font-medium shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Browse Image File</span>
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center space-x-2 text-rose-400 text-sm bg-rose-950/40 border border-rose-800/60 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
