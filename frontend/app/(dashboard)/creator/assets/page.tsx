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

const ModelViewer = dynamic(() => import('@/components/creator/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-surface-high rounded-lg overflow-hidden border border-border relative flex items-center justify-center">
      <Loader2 className="h-12 w-12 text-primary animate-spin" />
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

  useEffect(() => { fetchAssets(); }, []);

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

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFormat = filterFormat === 'all' || asset.output_format === filterFormat;
    return matchesSearch && matchesFormat;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatBadgeVariant = (format: string) => {
    if (format === 'obj') return 'default';
    if (format === 'glb') return 'info';
    return 'admin';
  };

  return (
    <div className="min-h-screen bg-background px-8 py-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-headline font-black tracking-tight text-foreground uppercase flex items-center gap-3">
                <Box className="h-8 w-8 text-accent" />
                3D <span className="text-accent">Assets</span>
              </h1>
              <p className="text-muted mt-2">View and manage your converted 3D models</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
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
          className="bg-surface border border-border rounded-lg p-6 mb-8 bloom-shadow"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted" />
              <select
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value)}
                className="bg-input border border-border text-foreground rounded-md px-4 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Formats</option>
                <option value="obj">OBJ</option>
                <option value="glb">GLB</option>
                <option value="gltf">GLTF</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4 text-sm text-muted">
            <span className="font-label text-[10px] uppercase tracking-widest">{filteredAssets.length} models found</span>
            {filterFormat !== 'all' && (
              <Badge variant="info">Filtered by {filterFormat.toUpperCase()}</Badge>
            )}
          </div>
        </motion.div>

        {/* Assets Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-20">
            <Box className="h-16 w-16 text-muted mx-auto mb-4" />
            <h3 className="text-foreground font-headline font-bold text-lg uppercase tracking-tight">No 3D models found</h3>
            <p className="text-muted mt-2">
              {searchQuery || filterFormat !== 'all' ? 'Try adjusting your search or filters' : 'Start by converting some 2D images to 3D models'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className="group relative bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-all duration-300 bloom-shadow"
              >
                <div className="aspect-square relative overflow-hidden bg-surface-high">
                  <img src={`http://localhost:5001${asset.thumbnail_url}`} alt={asset.file_name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-void-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleView(asset)} className="h-10 w-10 p-0 bg-surface/80 hover:bg-surface text-foreground rounded-full">
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDownload(asset)} className="h-10 w-10 p-0 bg-surface/80 hover:bg-surface text-foreground rounded-full">
                      <Download className="h-5 w-5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(asset.id)} className="h-10 w-10 p-0 bg-destructive/80 hover:bg-destructive text-white rounded-full">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant={formatBadgeVariant(asset.output_format)} className="uppercase">{asset.output_format}</Badge>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-medium text-foreground truncate">{asset.file_name}</h4>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="font-label">{formatDate(asset.created_at)}</span>
                    <Badge variant="success" className="capitalize">{asset.quality}</Badge>
                  </div>
                  <div className="text-xs text-muted font-label">{asset.file_size}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.01 }}
                className="bg-surface border border-border rounded-lg p-4 hover:border-primary transition-all duration-200 bloom-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-surface-high flex-shrink-0">
                    <img src={`http://localhost:5001${asset.thumbnail_url}`} alt={asset.file_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate mb-1">{asset.file_name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span className="font-label text-[10px] uppercase tracking-widest">{formatDate(asset.created_at)}</span>
                      <Badge variant={formatBadgeVariant(asset.output_format)} className="uppercase">{asset.output_format}</Badge>
                      <Badge variant="success" className="capitalize">{asset.quality}</Badge>
                      <span className="font-label text-[10px]">{asset.file_size}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleView(asset)}><Eye className="h-4 w-4 mr-2" />View</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(asset)}><Download className="h-4 w-4 mr-2" />Download</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(asset.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Model Viewer Modal */}
        {isViewingModel && selectedAsset && (
          <div className="fixed inset-0 z-50 bg-void-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsViewingModel(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface border-2 border-accent/30 rounded-lg p-6 max-w-4xl w-full bloom-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline text-lg font-bold text-foreground uppercase tracking-tight">{selectedAsset.file_name}</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsViewingModel(false)}>Close</Button>
              </div>
              <div className="aspect-square bg-surface-high rounded-lg overflow-hidden border border-border">
                <ModelViewer modelUrl={`http://localhost:5001${selectedAsset.model_url}`} />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3 text-sm text-muted">
                  <Badge variant={formatBadgeVariant(selectedAsset.output_format)} className="uppercase">{selectedAsset.output_format}</Badge>
                  <span className="font-label text-[10px]">{selectedAsset.file_size}</span>
                  <span className="font-label text-[10px]">{formatDate(selectedAsset.created_at)}</span>
                </div>
                <Button onClick={() => handleDownload(selectedAsset)}>
                  <Download className="h-4 w-4 mr-2" />Download Model
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
