'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Download,
  Settings2,
  ChevronDown,
  ChevronUp,
  Volume2,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { animationAPI, voiceAPI } from '@/lib/api';

type Stage = 'input' | 'generating' | 'preview';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';

interface VoicePreset {
  id: string;
  name: string;
  language: string;
}

export default function AnimatePage() {
  const [prompt, setPrompt] = useState('');
  const [stage, setStage] = useState<Stage>('input');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [voicePresets, setVoicePresets] = useState<VoicePreset[]>([]);
  const [settings, setSettings] = useState({
    num_frames_per_segment: 33,
    num_inference_steps: 30,
    fps: 16,
    voice_preset: 'af_heart',
    num_clips: 4,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load voice presets on mount
  useEffect(() => {
    voiceAPI.getPresets()
      .then((res) => {
        if (res.data?.data?.presets) {
          setVoicePresets(res.data.data.presets);
        }
      })
      .catch(() => {
        // Use defaults if backend not available
        setVoicePresets([
          { id: 'af_heart', name: 'Heart (Female)', language: 'en-us' },
          { id: 'am_adam', name: 'Adam (Male)', language: 'en-us' },
          { id: 'af_bella', name: 'Bella (Female)', language: 'en-us' },
          { id: 'am_michael', name: 'Michael (Male)', language: 'en-us' },
          { id: 'bf_emma', name: 'Emma (Female, British)', language: 'en-gb' },
          { id: 'bm_george', name: 'George (Male, British)', language: 'en-gb' },
        ]);
      });
  }, []);

  const handleGenerate = async () => {
    if (prompt.trim().length < 10) {
      setError('Please describe your scene in at least 10 characters');
      return;
    }

    setError(null);
    setStage('generating');

    try {
      const response = await animationAPI.generate({
        text: prompt.trim(),
        num_frames_per_segment: settings.num_frames_per_segment,
        num_inference_steps: settings.num_inference_steps,
        fps: settings.fps,
        voice_preset: settings.voice_preset,
        num_clips: settings.num_clips,
      });
      const data = response.data;

      if (data.success && data.data?.video_url) {
        setVideoUrl(`${API_BASE}${data.data.video_url}`);
        setVideoMeta(data.data);
        setStage('preview');
      } else {
        setError(data.message || 'Failed to generate animation');
        setStage('input');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to generate animation. Is the backend running?';
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

  const estimatedDuration = (settings.num_frames_per_segment / settings.fps) * settings.num_clips;

  return (
    <div className="min-h-screen bg-[#0a0a1f] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Text to Animation</h1>
            <p className="text-sm text-gray-400">
              Describe your scene and generate an animated video with AI voice
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
                <h2 className="text-lg font-semibold text-white">Describe Your Scene</h2>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleGenerate();
                  }
                }}
                placeholder="A cat walking through a sunlit garden, looking around curiously. The cat says 'What a beautiful day!' with a happy expression."
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
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        <SettingInput
                          label="Frames/Clip"
                          value={settings.num_frames_per_segment}
                          onChange={(v) => setSettings({ ...settings, num_frames_per_segment: v })}
                          min={17}
                          max={81}
                          step={8}
                          hint={`~${(settings.num_frames_per_segment / settings.fps).toFixed(1)}s each`}
                        />
                        <SettingInput
                          label="Number of Clips"
                          value={settings.num_clips}
                          onChange={(v) => setSettings({ ...settings, num_clips: v })}
                          min={1}
                          max={8}
                          hint={`~${estimatedDuration.toFixed(0)}s total`}
                        />
                        <SettingInput
                          label="Quality Steps"
                          value={settings.num_inference_steps}
                          onChange={(v) => setSettings({ ...settings, num_inference_steps: v })}
                          min={10}
                          max={50}
                        />
                      </div>

                      {/* Voice Selection */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Mic className="h-3.5 w-3.5 text-gray-400" />
                          <label className="text-xs text-gray-400">Voice</label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {voicePresets.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => setSettings({ ...settings, voice_preset: preset.id })}
                              className={`px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                                settings.voice_preset === preset.id
                                  ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              <span className="block font-medium">{preset.name}</span>
                              <span className="text-[10px] text-gray-500">{preset.language}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-500">
                  {prompt.length} chars &middot; ~{estimatedDuration.toFixed(0)}s video &middot; Cmd+Enter to generate
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={prompt.trim().length < 10}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6"
                >
                  <Film className="h-4 w-4 mr-2" />
                  Generate Animation
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
              <h2 className="text-xl font-semibold text-white mb-2">Generating Animation</h2>
              <p className="text-sm text-gray-400 mb-2">
                Building your scene with AI video + voice generation...
              </p>
              <p className="text-xs text-gray-500 mb-6">
                This takes 15-30+ minutes on Mac M4 Pro. Please be patient.
              </p>

              {/* Pipeline steps indicator */}
              <div className="max-w-sm mx-auto space-y-2 mb-6">
                {[
                  { label: 'Parsing scene description', icon: '1' },
                  { label: `Generating ${settings.num_clips} video clips`, icon: '2' },
                  { label: 'Creating AI voiceover', icon: '3' },
                  { label: 'Stitching final video', icon: '4' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-left">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-bold">
                      {step.icon}
                    </div>
                    <span className="text-xs text-gray-400">{step.label}</span>
                  </div>
                ))}
              </div>

              <div className="max-w-md mx-auto bg-white/5 rounded-xl p-4 text-left">
                <p className="text-xs text-gray-400 font-mono">
                  Prompt: {prompt.length > 120 ? prompt.slice(0, 120) + '...' : prompt}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  {settings.num_clips} clips &times; {settings.num_frames_per_segment} frames @{' '}
                  {settings.fps}fps = ~{estimatedDuration.toFixed(0)}s &middot; Voice: {settings.voice_preset}
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
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      Generated Animation
                      {videoMeta?.has_audio !== false && (
                        <Volume2 className="h-4 w-4 text-emerald-400" />
                      )}
                    </h2>
                    {videoMeta && (
                      <p className="text-xs text-gray-400 mt-1">
                        {videoMeta.duration}s &middot; {videoMeta.num_segments} clips &middot;{' '}
                        {videoMeta.fps}fps
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
                      New Animation
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
                {/* Scene info */}
                {videoMeta?.scene && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Scene parsed:</p>
                    <p className="text-sm text-gray-300">
                      {videoMeta.scene.title || 'Untitled Scene'}
                    </p>
                    {videoMeta.scene.objects?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Objects: {videoMeta.scene.objects.map((o: any) => o.name).join(', ')}
                      </p>
                    )}
                  </div>
                )}
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
    title: 'Garden Cat',
    text: 'A cute orange tabby cat walking through a sunlit garden with colorful flowers. The cat looks around curiously and says "What a beautiful day!" with a happy expression.',
  },
  {
    title: 'Robot Dance',
    text: 'A friendly robot dancing on a futuristic stage with colorful spotlights. The robot says "Watch my moves!" with an excited tone.',
  },
  {
    title: 'Ocean Sunset',
    text: 'A cinematic aerial view of turquoise ocean waves crashing on a sandy beach at sunset, golden light reflecting on the water.',
  },
  {
    title: 'Knight\'s Quest',
    text: 'A knight in shining armor approaches a castle gate and says "Open the gates!" with an urgent expression. Epic medieval atmosphere.',
  },
  {
    title: 'Space Journey',
    text: 'A spacecraft flying through a colorful nebula in deep space, stars twinkling, cinematic camera slowly rotating around the ship.',
  },
  {
    title: 'Forest Walk',
    text: 'Walking through a misty enchanted forest with rays of sunlight filtering through tall ancient trees. A narrator says "In the heart of the forest, magic awaits."',
  },
];
