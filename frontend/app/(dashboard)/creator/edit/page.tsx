'use client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Crop,
  Music,
  Mic,
  Loader2,
  Check,
  X,
  Upload,
  Film,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { conversionAPI, editAPI } from '@/lib/api';

interface SourceVideo {
  // Either an existing asset (id set, source_url undefined)
  // or an uploaded video (id undefined, source_url set with /uploads/... path).
  id?: string;
  source_url?: string;
  url: string;        // playable URL (full http/https)
  prompt: string;
  filename: string;
  duration: number;
}

interface VoicePreset {
  id: string;
  name: string;
  language: string;
}

const ASPECTS = [
  { value: 'original', label: 'Original' },
  { value: '16:9', label: '16:9 (Landscape)' },
  { value: '9:16', label: '9:16 (Vertical)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '4:5', label: '4:5 (Portrait)' },
] as const;

type Aspect = typeof ASPECTS[number]['value'];

export default function VideoEditPage() {
  // Source picker
  const [videos, setVideos] = useState<SourceVideo[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [source, setSource] = useState<SourceVideo | null>(null);

  // Edit settings
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [aspect, setAspect] = useState<Aspect>('original');
  const [keepOriginalAudio, setKeepOriginalAudio] = useState(true);
  const [originalAudioVolume, setOriginalAudioVolume] = useState(1.0);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicName, setMusicName] = useState<string>('');
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [musicUploading, setMusicUploading] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voicePreset, setVoicePreset] = useState('af_heart');
  const [voiceVolume, setVoiceVolume] = useState(1.0);
  const [voicePresets, setVoicePresets] = useState<VoicePreset[]>([]);

  // Render state
  const [rendering, setRendering] = useState(false);
  const [rendered, setRendered] = useState<{ url: string; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Source upload state
  const [sourceUploading, setSourceUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // Load source videos + voices
  useEffect(() => {
    loadVideos();
    editAPI.listVoices()
      .then((res) => setVoicePresets(res.data?.data?.presets || []))
      .catch(() => setVoicePresets([]));
  }, []);

  const loadVideos = async () => {
    setLoadingSources(true);
    try {
      const response = await conversionAPI.getHistory({ limit: 50, type: 'animation' });
      const rows = response?.data?.data?.conversions || [];
      setVideos(
        rows.map((r: any) => ({
          id: r.id,
          url: r.model_url?.startsWith('http') ? r.model_url : `${BACKEND_URL}${r.model_url}`,
          prompt: r.settings?.prompt || r.file_name || 'Untitled',
          filename: r.file_name || 'animation.mp4',
          duration: r.settings?.duration || 0,
        })),
      );
    } catch {
      setVideos([]);
    }
    setLoadingSources(false);
  };

  const pickSource = (v: SourceVideo) => {
    setSource(v);
    setTrimStart(0);
    setTrimEnd(v.duration || 0);
    setRendered(null);
    setError(null);
  };

  const handleSourceUpload = async (file: File) => {
    setSourceUploading(true);
    setError(null);
    try {
      const res = await editAPI.uploadSource(file);
      const data = res.data?.data;
      if (data?.url) {
        pickSource({
          source_url: data.url,
          url: `${BACKEND_URL}${data.url}`,
          prompt: data.filename || file.name,
          filename: data.filename || file.name,
          duration: data.duration || 0,
        });
      } else {
        setError('Upload returned no URL');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setSourceUploading(false);
    }
  };

  // Initialise trim_end once metadata loads (in case the saved duration was 0).
  const handleMetadata = () => {
    if (videoRef.current && (!trimEnd || trimEnd > videoRef.current.duration)) {
      setTrimEnd(Number(videoRef.current.duration.toFixed(2)));
    }
  };

  // Clamp playback to the selected trim window.
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime < trimStart) v.currentTime = trimStart;
    if (v.currentTime > trimEnd) {
      v.currentTime = trimStart;
      v.pause();
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMusicUploading(true);
    setError(null);
    try {
      const res = await editAPI.uploadMusic(file);
      setMusicUrl(res.data?.data?.url || null);
      setMusicName(file.name);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Music upload failed');
    } finally {
      setMusicUploading(false);
      if (musicInputRef.current) musicInputRef.current.value = '';
    }
  };

  const removeMusic = () => {
    setMusicUrl(null);
    setMusicName('');
  };

  const handleRender = async () => {
    if (!source) return;
    setRendering(true);
    setError(null);
    setRendered(null);
    try {
      const res = await editAPI.render({
        ...(source.id ? { source_id: source.id } : {}),
        ...(source.source_url ? { source_url: source.source_url } : {}),
        trim_start: trimStart,
        trim_end: trimEnd,
        aspect,
        music_url: musicUrl || undefined,
        music_volume: musicVolume,
        voice_text: voiceText.trim() || undefined,
        voice_preset: voicePreset,
        voice_volume: voiceVolume,
        keep_original_audio: keepOriginalAudio,
        original_audio_volume: originalAudioVolume,
      });
      const data = res.data?.data;
      if (data?.output_url) {
        setRendered({
          url: `${BACKEND_URL}${data.output_url}`,
          filename: data.filename,
        });
      } else {
        setError('No output returned');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Render failed');
    } finally {
      setRendering(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  const aspectStyle: React.CSSProperties =
    aspect === 'original'
      ? {}
      : {
          aspectRatio: aspect.replace(':', ' / '),
          objectFit: 'cover',
        };

  return (
    <div className="min-h-screen bg-background px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-headline font-black tracking-tight text-foreground uppercase flex items-center gap-3">
            <Scissors className="h-8 w-8 text-accent" />
            Video <span className="text-accent">Editor</span>
          </h1>
          <p className="text-muted mt-2">Trim, crop, add music or narration to your generated videos.</p>
        </motion.div>

        {!source ? (
          <SourcePicker
            videos={videos}
            loading={loadingSources}
            onPick={pickSource}
            onUpload={handleSourceUpload}
            uploading={sourceUploading}
            uploadError={error}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Preview + render result */}
            <div className="space-y-4">
              <div className="bg-surface border border-border rounded-lg overflow-hidden bloom-shadow">
                <div className="aspect-video bg-void-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={videoRef}
                    src={source.url}
                    controls
                    onLoadedMetadata={handleMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    style={aspectStyle}
                    className={aspect === 'original' ? 'w-full h-full' : 'h-full'}
                  />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <p className="text-xs text-muted truncate font-label">{source.prompt}</p>
                  <Button variant="ghost" size="sm" onClick={() => setSource(null)}>
                    <X className="h-3 w-3 mr-1" />
                    Change
                  </Button>
                </div>
              </div>

              {rendered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface border-2 border-accent/40 rounded-lg overflow-hidden bloom-shadow"
                >
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border bg-accent/10">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-accent" />
                      <h3 className="font-headline text-sm font-bold uppercase tracking-tight">Edit ready</h3>
                    </div>
                    <Link href="/creator/assets">
                      <Button size="sm" variant="ghost">View in Assets</Button>
                    </Link>
                  </div>
                  <video src={rendered.url} controls autoPlay className="w-full" />
                  <div className="p-3 flex items-center justify-end gap-2">
                    <a href={rendered.url} download={rendered.filename}>
                      <Button size="sm" variant="outline">Download</Button>
                    </a>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right: Controls */}
            <div className="space-y-4">
              {/* Trim */}
              <Section icon={<Scissors className="h-4 w-4" />} title="Trim">
                <RangeSlider
                  min={0}
                  max={Math.max(trimEnd, source.duration || 1)}
                  start={trimStart}
                  end={trimEnd}
                  onChange={(s, e) => { setTrimStart(s); setTrimEnd(e); }}
                />
                <div className="flex items-center justify-between text-[10px] font-label uppercase tracking-widest text-muted mt-2">
                  <span>Start: {fmt(trimStart)}</span>
                  <span>Length: {fmt(Math.max(0, trimEnd - trimStart))}</span>
                  <span>End: {fmt(trimEnd)}</span>
                </div>
              </Section>

              {/* Crop */}
              <Section icon={<Crop className="h-4 w-4" />} title="Aspect Ratio">
                <div className="flex flex-wrap gap-2">
                  {ASPECTS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setAspect(a.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        aspect === a.value
                          ? 'bg-primary/20 border border-primary/50 text-primary'
                          : 'bg-surface-high border border-border text-muted hover:border-primary/30'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Music */}
              <Section icon={<Music className="h-4 w-4" />} title="Background Music">
                {!musicUrl ? (
                  <div>
                    <input
                      ref={musicInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleMusicUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => musicInputRef.current?.click()}
                      disabled={musicUploading}
                      className="w-full"
                    >
                      {musicUploading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
                      ) : (
                        <><Upload className="h-4 w-4 mr-2" /> Upload Music File</>
                      )}
                    </Button>
                    <p className="text-[10px] text-muted/60 font-label mt-2 uppercase tracking-widest">
                      MP3, WAV, M4A, AAC, OGG
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-surface-high border border-border rounded-lg px-3 py-2">
                      <span className="text-xs text-foreground truncate font-label">{musicName}</span>
                      <button onClick={removeMusic} className="text-muted hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <VolumeSlider value={musicVolume} onChange={setMusicVolume} label="Music volume" />
                  </div>
                )}
              </Section>

              {/* Voice */}
              <Section icon={<Mic className="h-4 w-4" />} title="Narration">
                <textarea
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  placeholder="Optional — type narration text. Leave empty for no voiceover."
                  rows={2}
                  className="w-full bg-input border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {voiceText.trim() && (
                  <>
                    <div className="mt-3">
                      <label className="block text-[10px] font-label text-muted uppercase tracking-widest mb-2">Voice</label>
                      <select
                        value={voicePreset}
                        onChange={(e) => setVoicePreset(e.target.value)}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {voicePresets.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3">
                      <VolumeSlider value={voiceVolume} onChange={setVoiceVolume} label="Voice volume" />
                    </div>
                  </>
                )}
              </Section>

              {/* Original audio toggle */}
              <Section
                icon={keepOriginalAudio ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                title="Original Audio"
              >
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-foreground">Keep original audio track</span>
                  <input
                    type="checkbox"
                    checked={keepOriginalAudio}
                    onChange={(e) => setKeepOriginalAudio(e.target.checked)}
                    className="accent-primary h-4 w-4"
                  />
                </label>
                {keepOriginalAudio && (
                  <div className="mt-3">
                    <VolumeSlider
                      value={originalAudioVolume}
                      onChange={setOriginalAudioVolume}
                      label="Original volume"
                    />
                  </div>
                )}
              </Section>

              {/* Render button */}
              <div className="sticky bottom-4">
                <Button
                  onClick={handleRender}
                  disabled={rendering || !source}
                  className="w-full py-6 text-sm font-headline uppercase tracking-widest"
                >
                  {rendering ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rendering…</>
                  ) : (
                    <>Apply &amp; Render</>
                  )}
                </Button>
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-destructive mt-2 text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <p className="text-[10px] text-muted/60 font-label uppercase tracking-widest mt-2 text-center">
                  Rendering takes 10–30 seconds
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------- Subcomponents ----------------------------

function SourcePicker({ videos, loading, onPick, onUpload, uploading, uploadError }: {
  videos: SourceVideo[];
  loading: boolean;
  onPick: (v: SourceVideo) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  uploadError: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/*"
        onChange={handleFile}
        className="hidden"
      />

      <h2 className="font-headline text-base font-bold text-foreground uppercase tracking-tight mb-4">
        Pick a video to edit
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Upload tile — always first */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="group bg-surface border-2 border-dashed border-border rounded-lg overflow-hidden hover:border-primary hover:bg-surface-high transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="aspect-video flex items-center justify-center">
            {uploading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted group-hover:text-primary transition-colors" />
            )}
          </div>
          <div className="p-3">
            <p className="text-sm text-foreground font-medium">
              {uploading ? 'Uploading…' : 'Upload your own'}
            </p>
            <p className="text-[10px] text-muted font-label mt-0.5 uppercase tracking-widest">
              MP4, MOV, WebM &middot; max 100MB
            </p>
          </div>
        </motion.button>

        {/* Existing assets */}
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          videos.map((v) => (
            <motion.button
              key={v.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => onPick(v)}
              className="group bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-all text-left"
            >
              <div className="aspect-video bg-void-black">
                <video src={v.url} className="w-full h-full object-cover" muted />
              </div>
              <div className="p-3">
                <p className="text-sm text-foreground line-clamp-1">{v.prompt}</p>
                {v.duration > 0 && (
                  <p className="text-[10px] text-muted font-label mt-0.5">{v.duration.toFixed(1)}s</p>
                )}
              </div>
            </motion.button>
          ))
        )}
      </div>

      {!loading && videos.length === 0 && (
        <p className="text-xs text-muted/60 font-label mt-4 text-center">
          No saved videos yet. Upload one above, or{' '}
          <Link href="/creator/animate" className="text-primary hover:underline">
            generate an animation first
          </Link>
          .
        </p>
      )}

      {uploadError && (
        <p className="text-xs text-destructive mt-3 text-center">{uploadError}</p>
      )}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 bloom-shadow">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-primary">{icon}</span>
        <h3 className="font-headline text-xs font-bold text-foreground uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function VolumeSlider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-label text-muted uppercase tracking-widest">{label}</label>
        <span className="text-[10px] font-label text-muted">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1.5}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

/**
 * Minimal dual-handle range slider built from two native <input type=range>.
 * The lower one sets `start`, the upper sets `end`. They're stacked over a
 * coloured rail showing the selected window.
 */
function RangeSlider({ min, max, start, end, onChange }: {
  min: number;
  max: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}) {
  const range = Math.max(0.01, max - min);
  const startPct = ((start - min) / range) * 100;
  const endPct = ((end - min) / range) * 100;

  return (
    <div className="relative h-8">
      {/* Rail */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-surface-high rounded-full" />
      {/* Selected window */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full"
        style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
      />
      {/* Two range inputs stacked, with pointer-events on the thumb only via z-index. */}
      <input
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={start}
        onChange={(e) => {
          const v = Math.min(Number(e.target.value), end - 0.1);
          onChange(v, end);
        }}
        className="absolute top-0 left-0 w-full h-8 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={end}
        onChange={(e) => {
          const v = Math.max(Number(e.target.value), start + 0.1);
          onChange(start, v);
        }}
        className="absolute top-0 left-0 w-full h-8 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background"
      />
    </div>
  );
}
