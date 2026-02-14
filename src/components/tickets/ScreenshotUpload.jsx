/**
 * MYTICKETSLIVE - Screenshot Upload Component
 * Drag & drop or click to upload payment screenshot
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, FileCheck } from 'lucide-react';

// Format file size
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ScreenshotUpload({ onFileChange, file }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;

    // Validate type
    if (!f.type.startsWith('image/')) {
      return;
    }

    // Validate size (max 10MB)
    if (f.size > 10 * 1024 * 1024) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(f);

    onFileChange(f);
  }, [onFileChange]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  }, [handleFile]);

  const removeFile = useCallback(() => {
    setPreview(null);
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onFileChange]);

  // File is selected -- show preview
  if (file && preview) {
    return (
      <div className="relative">
        <div className="glass rounded-xl overflow-hidden">
          {/* Preview image */}
          <div className="relative aspect-video bg-black/50 flex items-center justify-center">
            <img
              src={preview}
              alt="Payment screenshot"
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* File info bar */}
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0">
                <FileCheck size={20} className="text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{file.name}</p>
                <p className="text-white/40 text-xs">{formatSize(file.size)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={removeFile}
              className="w-9 h-9 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/30 hover:text-red-300 transition shrink-0 ml-3"
              title="Remove"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No file -- show dropzone
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 ${
        isDragging
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
          : 'border-white/15 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center py-10 px-6">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${
          isDragging ? 'bg-blue-500/20' : 'bg-white/5'
        }`}>
          {isDragging ? (
            <ImageIcon size={28} className="text-blue-400" />
          ) : (
            <Upload size={28} className="text-white/30" />
          )}
        </div>

        <p className="text-white/70 text-sm font-medium mb-1">
          {isDragging ? 'Drop your screenshot here' : 'Drag & drop your payment screenshot'}
        </p>
        <p className="text-white/30 text-xs">
          or <span className="text-blue-400 hover:text-blue-300">click to browse</span> -- PNG, JPG up to 10MB
        </p>
      </div>
    </div>
  );
}
