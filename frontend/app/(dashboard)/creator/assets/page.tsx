'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Download,
  Eye,
  Trash2,
  Filter,
  Search,
  Grid3x3,
  List,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { conversionAPI } from '@/lib/api';
import dynamic from 'next/dynamic';

// Dynamically import ModelViewer to disable SSR
const ModelViewer = dynamic(() => import('@/components/creator/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden border border-gray-200 relative flex items-center justify-center">
      <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
    </div>
  ),
});

interface Asset {
  id: string;
  file_name: string;
  original_image_url: string;
  thumbnail_url: string;
  model_url: string;
  output_format: string;
  quality: string;
  file_size: string;
  created_at: string;
}

type ViewMode = 'grid' | 'list';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isViewingModel, setIsViewingModel] = useState(false);

  // Load assets from database
  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await conversionAPI.getHistory({ limit: 50 });
      const conversions = response.data.data.conversions || [];
      setAssets(conversions);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      await conversionAPI.deleteConversion(id);
      setAssets((prev) => prev.filter((asset) => asset.id !== id));

      // Close viewer if viewing the deleted asset
      if (selectedAsset?.id === id) {
        setIsViewingModel(false);
        setSelectedAsset(null);
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
      alert('Failed to delete asset. Please try again.');
    }
  };

  const handleDownload = (asset: Asset) => {
    const downloadUrl = `http://localhost:5001${asset.model_url}?download=true`;
    window.open(downloadUrl, '_blank');
  };

  const handleView = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsViewingModel(true);
  };

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFormat = filterFormat === 'all' || asset.output_format === filterFormat;
    return matchesSearch && matchesFormat;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a1f] p-6 lg:p-8 pt-6 lg:pt-8 relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a1a3e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a3e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Box className="h-8 w-8 text-blue-400" />
                3D Assets
              </h1>
              <p className="text-gray-400">
                View and manage your converted 3D models
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-gradient-to-r from-blue-500 to-emerald-500' : 'border-white/20 text-white hover:bg-white/10'}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-emerald-500' : 'border-white/20 text-white hover:bg-white/10'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 rounded-xl"
              />
            </div>

            {/* Format Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Formats</option>
                <option value="obj">OBJ</option>
                <option value="glb">GLB</option>
                <option value="gltf">GLTF</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm text-gray-400">
            <span>{filteredAssets.length} models found</span>
            {filterFormat !== 'all' && (
              <Badge className="bg-blue-500/20 text-blue-400 border-0">
                Filtered by {filterFormat.toUpperCase()}
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Assets Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-20">
            <Box className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-300 font-medium text-lg">No 3D models found</h3>
            <p className="text-gray-400 mt-2">
              {searchQuery || filterFormat !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by converting some 2D images to 3D models'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden hover:shadow-lg hover:border-white/30 transition-all duration-200"
              >
                {/* Thumbnail */}
                <div className="aspect-square relative overflow-hidden bg-gray-900">
                  <img
                    src={`http://localhost:5001${asset.thumbnail_url}`}
                    alt={asset.file_name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleView(asset)}
                      className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 text-white rounded-full"
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(asset)}
                      className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 text-white rounded-full"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(asset.id)}
                      className="h-10 w-10 p-0 bg-red-500/80 hover:bg-red-600/80 text-white rounded-full"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Format Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-black/70 text-white text-xs border-0 uppercase">
                      {asset.output_format}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h4 className="font-medium text-white truncate">
                    {asset.file_name}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(asset.created_at)}</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs capitalize">
                      {asset.quality}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-400">
                    {asset.file_size}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 hover:shadow-lg hover:border-white/30 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-900 flex-shrink-0">
                    <img
                      src={`http://localhost:5001${asset.thumbnail_url}`}
                      alt={asset.file_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate mb-1">
                      {asset.file_name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{formatDate(asset.created_at)}</span>
                      <Badge className="bg-black/70 text-white text-xs border-0 uppercase">
                        {asset.output_format}
                      </Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs capitalize">
                        {asset.quality}
                      </Badge>
                      <span>{asset.file_size}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleView(asset)}
                      className="bg-white/10 hover:bg-white/20 text-white rounded-lg"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(asset)}
                      className="bg-white/10 hover:bg-white/20 text-white rounded-lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(asset.id)}
                      className="bg-red-500/80 hover:bg-red-600/80 text-white rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Model Viewer Modal */}
        {isViewingModel && selectedAsset && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsViewingModel(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">
                  {selectedAsset.file_name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsViewingModel(false)}
                  className="text-white hover:bg-white/20"
                >
                  Close
                </Button>
              </div>

              <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
                <ModelViewer
                  modelUrl={`http://localhost:5001${selectedAsset.model_url}`}
                  format={selectedAsset.output_format}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Badge className="bg-black/70 text-white text-xs border-0 uppercase">
                    {selectedAsset.output_format}
                  </Badge>
                  <span>{selectedAsset.file_size}</span>
                  <span>{formatDate(selectedAsset.created_at)}</span>
                </div>
                <Button
                  onClick={() => handleDownload(selectedAsset)}
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Model
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
