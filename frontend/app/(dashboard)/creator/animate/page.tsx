'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Play,
  Download,
  Settings2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { animationAPI } from '@/lib/api';

type Stage = 'input' | 'generating' | 'preview';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';

export default function AnimatePage() {
  const [prompt, setPrompt] = useState('');
  const [stage, setStage] = useState<Stage>('input');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    num_frames: 61,
    num_inference_steps: 30,
    fps: 15,
    height: 480,
    width: 848,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleGenerate = async () => {
    if (prompt.trim().length < 10) {
      setError('Please describe your video in at least 10 characters');
      return;
    }

    setError(null);
    setStage('generating');

    try {
      const response = await animationAPI.generate({
        prompt: prompt.trim(),
        ...settings,
      });
      const data = response.data;

      if (data.success && data.data?.video_url) {
        setVideoUrl(`${API_BASE}${data.data.video_url}`);
        setVideoMeta(data.data);
        setStage('preview');
      } else {
        setError(data.message || 'Failed to generate video');
        setStage('input');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to generate video. Is the backend running with GPU access?';
      setError(msg);
      setStage('input');
    }
  };

  const handleReset = () => {
    setStage('input');
    setVideoUrl(null);
    setVideoMeta(null);
    setError(null);
    setPrompt('');
  };

  const handleNewVideo = () => {
    setStage('input');
    setVideoUrl(null);
    setVideoMeta(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = videoMeta?.filename || 'animation.mp4';
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a1f] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Text to Video</h1>
            <p className="text-sm text-gray-400">
              Describe your scene and generate a video with HunyuanVideo 1.5
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Progress */}
      <PipelineProgress stage={stage} />

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* Stage: Input */}
        {stage === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Prompt Input */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Describe Your Video</h2>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleGenerate();
                  }
                }}
                placeholder="A cinematic shot of a golden retriever running through a field of sunflowers at sunset, slow motion..."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />

              {/* Settings Toggle */}
              <div className="mt-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Advanced Settings
                  {showSettings ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <SettingInput
                          label="Frames"
                          value={settings.num_frames}
                          onChange={(v) => setSettings({ ...settings, num_frames: v })}
                          min={17}
                          max={121}
                          step={4}
                          hint={`~${(settings.num_frames / settings.fps).toFixed(1)}s`}
                        />
                        <SettingInput
                          label="Quality Steps"
                          value={settings.num_inference_steps}
                          onChange={(v) => setSettings({ ...settings, num_inference_steps: v })}
                          min={10}
                          max={50}
                        />
                        <SettingInput
                          label="FPS"
                          value={settings.fps}
                          onChange={(v) => setSettings({ ...settings, fps: v })}
                          min={8}
                          max={30}
                        />
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Resolution</label>
                          <select
                            value={`${settings.width}x${settings.height}`}
                            onChange={(e) => {
                              const [w, h] = e.target.value.split('x').map(Number);
                              setSettings({ ...settings, width: w, height: h });
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                          >
                            <option value="848x480">480p (848x480)</option>
                            <option value="1280x720">720p (1280x720)</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-500">
                  {prompt.length} characters &middot; Cmd+Enter to generate
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={prompt.trim().length < 10}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6"
                >
                  <Film className="h-4 w-4 mr-2" />
                  Generate Video
                </Button>
              </div>
            </div>

            {/* Example Prompts */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Try an example</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {EXAMPLE_PROMPTS.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(example.text)}
                    className="text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                  >
                    <p className="text-sm font-medium text-white mb-1">{example.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{example.text}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage: Generating */}
        {stage === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Generating Video</h2>
              <p className="text-sm text-gray-400 mb-2">
                HunyuanVideo 1.5 is creating your video...
              </p>
              <p className="text-xs text-gray-500 mb-6">
                This may take a few minutes depending on settings and hardware.
              </p>
              <div className="max-w-md mx-auto bg-white/5 rounded-xl p-4 text-left">
                <p className="text-xs text-gray-400 font-mono">
                  Prompt: {prompt.length > 100 ? prompt.slice(0, 100) + '...' : prompt}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  {settings.num_frames} frames @ {settings.fps}fps = ~
                  {(settings.num_frames / settings.fps).toFixed(1)}s &middot;{' '}
                  {settings.width}x{settings.height}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage: Preview */}
        {stage === 'preview' && videoUrl && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Video Player */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="relative bg-black aspect-video">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Generated Video</h2>
                    {videoMeta && (
                      <p className="text-xs text-gray-400 mt-1">
                        {videoMeta.duration}s &middot; {videoMeta.resolution} &middot;{' '}
                        {videoMeta.fps}fps &middot; {videoMeta.num_frames} frames
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={handleNewVideo}
                      className="text-gray-400 hover:text-white"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      New Video
                    </Button>
                    <Button
                      onClick={handleDownload}
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download MP4
                    </Button>
                  </div>
                </div>
                {/* Prompt used */}
                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Prompt used:</p>
                  <p className="text-sm text-gray-300">{videoMeta?.prompt || prompt}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function PipelineProgress({ stage }: { stage: Stage }) {
  const steps = [
    { id: 'input', label: 'Describe' },
    { id: 'generating', label: 'Generate' },
    { id: 'preview', label: 'Preview' },
  ];

  const getStepStatus = (stepId: string) => {
    const order = ['input', 'generating', 'preview'];
    const currentIdx = order.indexOf(stage);
    const stepIdx = order.indexOf(stepId);
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="mb-8 flex items-center gap-2">
      {steps.map((step, i) => {
        const status = getStepStatus(step.id);
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : status === 'active'
                  ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                  : 'bg-white/5 text-gray-500'
              }`}
            >
              {status === 'completed' ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px]">
                  {i + 1}
                </span>
              )}
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-px ${
                  status === 'completed' ? 'bg-emerald-500/50' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SettingInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">
        {label} {hint && <span className="text-gray-500">({hint})</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
      />
    </div>
  );
}

// --- Example prompts ---
const EXAMPLE_PROMPTS = [
  {
    title: 'Golden Hour',
    text: 'A cinematic shot of a golden retriever running through a field of sunflowers at sunset, slow motion, warm golden light',
  },
  {
    title: 'Ocean Waves',
    text: 'Aerial view of turquoise ocean waves crashing on a sandy beach, birds eye view, 4K cinematic footage',
  },
  {
    title: 'City at Night',
    text: 'A time-lapse of a bustling city skyline transitioning from sunset to night, car lights creating streaks, neon signs glowing',
  },
  {
    title: 'Space Journey',
    text: 'A spacecraft flying through a colorful nebula in deep space, stars twinkling, cinematic camera movement',
  },
  {
    title: 'Forest Walk',
    text: 'Walking through an enchanted forest with rays of sunlight filtering through tall trees, misty atmosphere, first person perspective',
  },
  {
    title: 'Dancing Robot',
    text: 'A cute cartoon robot dancing on a stage with colorful spotlights, disco ball, energetic movements',
  },
];
