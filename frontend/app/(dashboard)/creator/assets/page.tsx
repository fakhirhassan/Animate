'use client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Download,
  Eye,
  Trash2,
  Search,
  Grid3x3,
  List,
  Loader2,
  ImageIcon,
  Film,
  Play,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { conversionAPI } from '@/lib/api';
import { withAuth } from '@/lib/utils';
import dynamic from 'next/dynamic';

const ModelViewer = dynamic(() => import('@/components/creator/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-surface-high rounded-lg overflow-hidden border border-border relative flex items-center justify-center">
      <Loader2 className="h-12 w-12 text-primary animate-spin" />
    </div>
  ),
});

type AssetType = 'all' | '3d' | 'images' | 'videos';
type ViewMode = 'grid' | 'list';

interface Model3D {
  kind: '3d';
  id: string;
  file_name: string;
  thumbnail_url: string;
  model_url: string;
  output_format: string;
  quality: string;
  file_size: string;
  created_at: string;
}

interface ImageAsset {
  kind: 'image';
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
}

interface VideoAsset {
  kind: 'video';
  id: string;
  url: string;
  prompt: string;
  filename: string;
  duration: string;
  createdAt: string;
}

type Asset = Model3D | ImageAsset | VideoAsset;

const TYPE_FILTERS: { value: AssetType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Grid3x3 className="h-3.5 w-3.5" /> },
  { value: '3d', label: '3D Models', icon: <Box className="h-3.5 w-3.5" /> },
  { value: 'images', label: 'Images', icon: <ImageIcon className="h-3.5 w-3.5" /> },
  { value: 'videos', label: 'Videos', icon: <Film className="h-3.5 w-3.5" /> },
];

export default function AssetsPage() {
  const [models, setModels] = useState<Model3D[]>([]);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setIsLoading(true);

    try {
      // Single backend call returns all types — split client-side by `type`.
      const response = await conversionAPI.getHistory({ limit: 200 });
      const conversions: any[] = response?.data?.data?.conversions || [];

      const m: Model3D[] = [];
      const imgs: ImageAsset[] = [];
      const vids: VideoAsset[] = [];

      for (const c of conversions) {
        if (c.type === 'image') {
          imgs.push({
            kind: 'image',
            id: c.id,
            url: c.model_url?.startsWith('http') ? c.model_url : `${BACKEND_URL}${c.model_url}`,
            prompt: c.settings?.prompt || c.file_name || 'Untitled',
            createdAt: c.created_at,
          });
        } else if (c.type === 'animation') {
          vids.push({
            kind: 'video',
            id: c.id,
            url: c.model_url?.startsWith('http') ? c.model_url : `${BACKEND_URL}${c.model_url}`,
            prompt: c.settings?.prompt || c.file_name || 'Untitled',
            filename: c.file_name || 'animation.mp4',
            duration: c.settings?.duration ? `${c.settings.duration}s` : '',
            createdAt: c.created_at,
          });
        } else {
          // type === '3d' (default)
          m.push({ kind: '3d', ...c });
        }
      }

      setModels(m);
      setImages(imgs);
      setVideos(vids);
    } catch {
      setModels([]);
      setImages([]);
      setVideos([]);
    }

    setIsLoading(false);
  };

  const allAssets: Asset[] = [...models, ...images, ...videos].sort((a, b) => {
    const dateA = a.kind === '3d' ? a.created_at : a.createdAt;
    const dateB = b.kind === '3d' ? b.created_at : b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const filtered = allAssets.filter((asset) => {
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === '3d' && asset.kind === '3d') ||
      (typeFilter === 'images' && asset.kind === 'image') ||
      (typeFilter === 'videos' && asset.kind === 'video');
    const name = asset.kind === '3d' ? asset.file_name : asset.prompt;
    return matchesType && name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const counts = { all: allAssets.length, '3d': models.length, images: images.length, videos: videos.length };

  const handleDelete = async (asset: Asset) => {
    if (!confirm('Delete this asset?')) return;
    try {
      await conversionAPI.deleteConversion(asset.id);
      if (asset.kind === '3d') setModels(prev => prev.filter(m => m.id !== asset.id));
      else if (asset.kind === 'image') setImages(prev => prev.filter(i => i.id !== asset.id));
      else setVideos(prev => prev.filter(v => v.id !== asset.id));
    } catch {
      alert('Failed to delete asset');
      return;
    }
    if (previewAsset?.id === asset.id) setPreviewAsset(null);
  };

  const handleDownload = (asset: Asset) => {
    const url = asset.kind === '3d' ? withAuth(`${BACKEND_URL}${asset.model_url}?download=true`) : asset.url;
    const filename = asset.kind === '3d' ? asset.file_name : asset.kind === 'video' ? asset.filename : `image_${Date.now()}.png`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const getLabel = (a: Asset) => a.kind === '3d' ? a.file_name : a.prompt;
  const getDate = (a: Asset) => a.kind === '3d' ? a.created_at : a.createdAt;

  return (
    <div className="min-h-screen bg-background px-8 py-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-headline font-black tracking-tight text-foreground uppercase flex items-center gap-3">
                <Grid3x3 className="h-8 w-8 text-accent" />
                My <span className="text-accent">Assets</span>
              </h1>
              <p className="text-muted mt-2">All your generated 3D models, images, and videos in one place</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-lg p-6 mb-8 bloom-shadow">

          {/* Type tabs */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {TYPE_FILTERS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-label uppercase tracking-widest transition-all ${
                  typeFilter === value
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-surface-high text-muted border border-border hover:border-primary/30'
                }`}
              >
                {icon}
                {label}
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  typeFilter === value ? 'bg-primary/30 text-primary' : 'bg-border text-muted'
                }`}>
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="Search by name or prompt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-[10px] font-label uppercase tracking-widest text-muted mt-3">
            {filtered.length} asset{filtered.length !== 1 ? 's' : ''} found
          </p>
        </motion.div>

        {/* Assets */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Grid3x3 className="h-16 w-16 text-muted mx-auto mb-4" />
            <h3 className="text-foreground font-headline font-bold text-lg uppercase tracking-tight">No assets found</h3>
            <p className="text-muted mt-2">
              {searchQuery ? 'Try adjusting your search' : 'Generate some content to see it here'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((asset, index) => (
              <AssetCard key={asset.id} asset={asset} index={index}
                onView={() => setPreviewAsset(asset)}
                onDownload={() => handleDownload(asset)}
                onDelete={() => handleDelete(asset)}
                formatDate={formatDate} getLabel={getLabel} getDate={getDate}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
            {filtered.map((asset, index) => (
              <AssetRow key={asset.id} asset={asset} index={index}
                onView={() => setPreviewAsset(asset)}
                onDownload={() => handleDownload(asset)}
                onDelete={() => handleDelete(asset)}
                formatDate={formatDate} getLabel={getLabel} getDate={getDate}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewAsset && (
          <div className="fixed inset-0 z-50 bg-void-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewAsset(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-surface border-2 border-accent/30 rounded-lg p-6 max-w-4xl w-full bloom-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline text-lg font-bold text-foreground uppercase tracking-tight truncate pr-4">
                  {getLabel(previewAsset)}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setPreviewAsset(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {previewAsset.kind === '3d' && (
                <div className="aspect-square bg-surface-high rounded-lg overflow-hidden border border-border">
                  <ModelViewer modelUrl={withAuth(`${BACKEND_URL}${previewAsset.model_url}`)} />
                </div>
              )}
              {previewAsset.kind === 'image' && (
                <img src={previewAsset.url} alt={previewAsset.prompt}
                  className="w-full rounded-xl max-h-[70vh] object-contain" />
              )}
              {previewAsset.kind === 'video' && (
                <video src={previewAsset.url} controls autoPlay
                  className="w-full rounded-xl max-h-[70vh]" />
              )}

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted font-label">{formatDate(getDate(previewAsset))}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleDelete(previewAsset)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" />Delete
                  </Button>
                  <Button onClick={() => handleDownload(previewAsset)}>
                    <Download className="h-4 w-4 mr-2" />Download
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssetTypeBadge({ kind }: { kind: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'info' | 'admin' }> = {
    '3d': { label: '3D', variant: 'default' },
    image: { label: 'Image', variant: 'info' },
    video: { label: 'Video', variant: 'admin' },
  };
  const { label, variant } = map[kind] || { label: kind, variant: 'default' as const };
  return <Badge variant={variant}>{label}</Badge>;
}

function AssetThumbnail({ asset }: { asset: Asset }) {
  if (asset.kind === '3d') {
    return (
      <img src={`${BACKEND_URL}${asset.thumbnail_url}`} alt={asset.file_name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
    );
  }
  if (asset.kind === 'image') {
    return (
      <img src={asset.url} alt={asset.prompt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
    );
  }
  return (
    <div className="relative w-full h-full bg-void-black flex items-center justify-center">
      <video src={asset.url} className="w-full h-full object-cover opacity-60" muted />
      <Play className="absolute h-8 w-8 text-white opacity-80" />
    </div>
  );
}

function AssetCard({ asset, index, onView, onDownload, onDelete, formatDate, getLabel, getDate }: {
  asset: Asset; index: number;
  onView: () => void; onDownload: () => void; onDelete: () => void;
  formatDate: (d: string) => string;
  getLabel: (a: Asset) => string;
  getDate: (a: Asset) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      whileHover={{ scale: 1.03 }}
      className="group relative bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-all duration-300 bloom-shadow"
    >
      <div className="aspect-square relative overflow-hidden bg-surface-high">
        <AssetThumbnail asset={asset} />
        <div className="absolute inset-0 bg-void-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <Button size="sm" variant="ghost" onClick={onView} className="h-10 w-10 p-0 bg-surface/80 hover:bg-surface text-foreground rounded-full">
            <Eye className="h-5 w-5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDownload} className="h-10 w-10 p-0 bg-surface/80 hover:bg-surface text-foreground rounded-full">
            <Download className="h-5 w-5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-10 w-10 p-0 bg-destructive/80 hover:bg-destructive text-white rounded-full">
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute top-2 right-2">
          <AssetTypeBadge kind={asset.kind} />
        </div>
      </div>
      <div className="p-4 space-y-1">
        <h4 className="font-medium text-foreground truncate text-sm">{getLabel(asset)}</h4>
        <p className="text-xs text-muted font-label">{formatDate(getDate(asset))}</p>
        {asset.kind === '3d' && (
          <div className="flex items-center gap-2">
            <Badge variant="success" className="capitalize text-[10px]">{asset.quality}</Badge>
            <span className="text-[10px] text-muted font-label">{asset.file_size}</span>
          </div>
        )}
        {asset.kind === 'video' && asset.duration && (
          <span className="text-[10px] text-muted font-label">{asset.duration}</span>
        )}
      </div>
    </motion.div>
  );
}

function AssetRow({ asset, index, onView, onDownload, onDelete, formatDate, getLabel, getDate }: {
  asset: Asset; index: number;
  onView: () => void; onDownload: () => void; onDelete: () => void;
  formatDate: (d: string) => string;
  getLabel: (a: Asset) => string;
  getDate: (a: Asset) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
      className="bg-surface border border-border rounded-lg p-4 hover:border-primary transition-all duration-200 bloom-shadow"
    >
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-high flex-shrink-0 group">
          <AssetThumbnail asset={asset} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AssetTypeBadge kind={asset.kind} />
            <h4 className="font-medium text-foreground truncate text-sm">{getLabel(asset)}</h4>
          </div>
          <p className="text-xs text-muted font-label">{formatDate(getDate(asset))}</p>
          {asset.kind === '3d' && <p className="text-xs text-muted font-label">{asset.file_size} · {asset.quality} quality</p>}
          {asset.kind === 'video' && asset.duration && <p className="text-xs text-muted font-label">{asset.duration}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onView}><Eye className="h-4 w-4 mr-2" />View</Button>
          <Button size="sm" variant="outline" onClick={onDownload}><Download className="h-4 w-4 mr-2" />Download</Button>
          <Button size="sm" variant="outline" onClick={onDelete} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
