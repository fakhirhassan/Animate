'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

interface ImageUploaderProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
}

export default function ImageUploader({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError('');

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errorMessages = rejectedFiles.map((f) => {
          if (f.errors[0]?.code === 'file-too-large') {
            return `${f.file.name} is too large (max ${maxSize}MB)`;
          }
          if (f.errors[0]?.code === 'file-invalid-type') {
            return `${f.file.name} has invalid format`;
          }
          return f.errors[0]?.message;
        });
        setError(errorMessages.join(', '));
        return;
      }

      // Check max files limit
      if (files.length + acceptedFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Create preview URLs
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
      }));

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    },
    [files, maxFiles, maxSize, onFilesChange]
  );

  const removeFile = (id: string) => {
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    onFilesChange([]);
    setError('');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/svg+xml': ['.svg'],
    },
    maxSize: maxSize * 1024 * 1024,
    multiple: true,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <motion.div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input {...getInputProps()} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}
            `}
          >
            <Upload
              className={`h-8 w-8 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
            />
          </div>

          <div>
            <p className="text-gray-900 font-medium">
              {isDragActive ? 'Drop your images here' : 'Drag & drop images here'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              or click to browse files
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-1 bg-gray-100 rounded">PNG</span>
            <span className="px-2 py-1 bg-gray-100 rounded">JPG</span>
            <span className="px-2 py-1 bg-gray-100 rounded">JPEG</span>
            <span className="px-2 py-1 bg-gray-100 rounded">SVG</span>
          </div>

          <p className="text-xs text-gray-400">
            Max {maxSize}MB per file, up to {maxFiles} files
          </p>
        </motion.div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Previews */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                >
                  {file.file.type === 'image/svg+xml' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* File name */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs truncate">{file.file.name}</p>
                    <p className="text-white/70 text-xs">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
