'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Download,
  Eye,
  Trash2,
  ChevronRight,
  Calendar,
  FileType,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ConversionHistoryItem {
  id: string;
  originalImage: string;
  thumbnailUrl: string;
  modelUrl: string;
  fileName: string;
  format: string;
  quality: string;
  createdAt: Date;
  fileSize: string;
}

interface ConversionHistoryProps {
  items: ConversionHistoryItem[];
  onView: (item: ConversionHistoryItem) => void;
  onDownload: (item: ConversionHistoryItem) => void;
  onDelete: (id: string) => void;
}

export default function ConversionHistory({
  items,
  onView,
  onDownload,
  onDelete,
}: ConversionHistoryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (itemId: string) => {
    console.error(`Failed to load image for item: ${itemId}`);
    setImageErrors(prev => new Set(prev).add(itemId));
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-gray-500 font-medium">No conversion history</h3>
        <p className="text-gray-400 text-sm mt-1">
          Your converted models will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent Conversions</h3>
        <span className="text-sm text-gray-400">{items.length} items</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden hover:shadow-lg hover:border-white/30 transition-all duration-200"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Thumbnail */}
              <div className="aspect-square relative overflow-hidden bg-gray-900">
                {imageErrors.has(item.id) ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FileType className="h-12 w-12" />
                  </div>
                ) : (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.fileName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => handleImageError(item.id)}
                    crossOrigin="anonymous"
                  />
                )}

                {/* Hover Overlay */}
                <AnimatePresence>
                  {hoveredId === item.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2"
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onView(item)}
                        className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 text-white rounded-full"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDownload(item)}
                        className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 text-white rounded-full"
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(item.id)}
                        className="h-10 w-10 p-0 bg-red-500/80 hover:bg-red-600/80 text-white rounded-full"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Format Badge */}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-black/70 text-white text-xs font-medium rounded uppercase">
                    {item.format}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <h4 className="font-medium text-white truncate text-sm">
                  {item.fileName}
                </h4>

                <div className="flex items-center justify-between text-xs text-gray-300">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileType className="h-3 w-3" />
                    <span>{item.fileSize}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`
                      px-2 py-0.5 text-xs rounded-full capitalize
                      ${item.quality === 'high' ? 'bg-green-500/20 text-green-300' : ''}
                      ${item.quality === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                      ${item.quality === 'low' ? 'bg-gray-500/20 text-gray-300' : ''}
                    `}
                  >
                    {item.quality} quality
                  </span>
                </div>
              </div>

              {/* Quick View Button */}
              <button
                onClick={() => onView(item)}
                className="absolute bottom-0 left-0 right-0 h-0 group-hover:h-10 bg-blue-500 text-white flex items-center justify-center gap-2 transition-all duration-200 overflow-hidden"
              >
                <span className="text-sm font-medium">View Model</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {items.length >= 8 && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
