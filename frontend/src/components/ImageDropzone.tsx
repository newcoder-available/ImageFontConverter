'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, FileCode } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelected: (file: File, base64?: string) => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ 
  onImageSelected, 
  disabled = false,
  isProcessing = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) setIsDragging(true);
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

    // Max 25MB
    if (file.size > 25 * 1024 * 1024) {
      setError('Image file is too large. Maximum supported size is 25MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      onImageSelected(file, b64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isProcessing) return;

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
        onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
        } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isProcessing}
        />

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-7 h-7 text-cyan-400" />
        </div>

        <h4 className="text-sm font-bold text-white mb-1">
          Drop your image here, or browse files
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mb-3">
          AI automatically detects text, font appearance, and source language.
        </p>

        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
          <span>PNG</span>
          <span>•</span>
          <span>JPG</span>
          <span>•</span>
          <span>WEBP</span>
          <span>•</span>
          <span>MAX 25MB</span>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-400 flex items-center space-x-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
