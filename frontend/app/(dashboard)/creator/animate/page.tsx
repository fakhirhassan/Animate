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
    num_frames_per_segment: 81,
    num_inference_steps: 30,
    fps: 16,
    voice_preset: 'af_heart',
    num_clips: 4,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    voiceAPI.getPresets()
      .then((res) => {
        if (res.data?.data?.presets) {
          setVoicePresets(res.data.data.presets);
        }
      })
      .catch(() => {
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
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to generate animation. Is the backend running?';
      setError(msg);
      setStage('input');
    }
  };

  const handleReset = () => { setStage('input'); setVideoUrl(null); setVideoMeta(null); setError(null); setPrompt(''); };
  const handleNewVideo = () => { setStage('input'); setVideoUrl(null); setVideoMeta(null); setError(null); };
  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = videoMeta?.filename || 'animation.mp4';
    a.click();
  };

  const estimatedDuration = (settings.num_frames_per_segment / settings.fps) * settings.num_clips;

  return (
    <div className="min-h-screen bg-background px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold text-foreground uppercase tracking-tight">Text to Animation</h1>
            <p className="text-sm text-muted">Describe your scene and generate an animated video with AI voice</p>
          </div>
        </div>
      </div>

      <PipelineProgress stage={stage} />

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <p className="text-destructive text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-destructive hover:text-destructive/80">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* Stage: Input */}
        {stage === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
            <div className="bg-surface border border-border rounded-lg p-6 bloom-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-highlight" />
                <h2 className="font-headline text-sm font-bold text-foreground uppercase tracking-tight">Describe Your Scene</h2>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                placeholder="A cat walking through a sunlit garden, looking around curiously. The cat says 'What a beautiful day!' with a happy expression."
                className="w-full h-40 bg-input border border-border rounded-lg p-4 text-foreground placeholder:text-muted/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />

              {/* Settings Toggle */}
              <div className="mt-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors font-label uppercase tracking-widest"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Advanced Settings
                  {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        <SettingInput label="Frames/Clip" value={settings.num_frames_per_segment} onChange={(v) => setSettings({ ...settings, num_frames_per_segment: v })} min={17} max={81} step={8} hint={`~${(settings.num_frames_per_segment / settings.fps).toFixed(1)}s each`} />
                        <SettingInput label="Number of Clips" value={settings.num_clips} onChange={(v) => setSettings({ ...settings, num_clips: v })} min={1} max={8} hint={`~${estimatedDuration.toFixed(0)}s total`} />
                        <SettingInput label="Quality Steps" value={settings.num_inference_steps} onChange={(v) => setSettings({ ...settings, num_inference_steps: v })} min={10} max={50} />
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Mic className="h-3.5 w-3.5 text-muted" />
                          <label className="font-label text-[10px] text-muted uppercase tracking-widest">Voice</label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {voicePresets.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => setSettings({ ...settings, voice_preset: preset.id })}
                              className={`px-3 py-2 rounded-lg text-xs text-left transition-all duration-200 ${
                                settings.voice_preset === preset.id
                                  ? 'bg-primary/20 border border-primary/50 text-primary'
                                  : 'bg-surface-high border border-border text-muted hover:border-primary/30'
                              }`}
                            >
                              <span className="block font-medium">{preset.name}</span>
                              <span className="text-[10px] font-label text-muted/50">{preset.language}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted font-label">
                  {prompt.length} chars &middot; ~{estimatedDuration.toFixed(0)}s video &middot; Cmd+Enter to generate
                </p>
                <Button onClick={handleGenerate} disabled={prompt.trim().length < 10} className="font-headline text-xs tracking-widest">
                  <Film className="h-4 w-4 mr-2" />Generate Animation
                </Button>
              </div>
            </div>

            {/* Example Prompts */}
            <div>
              <h3 className="font-label text-[10px] uppercase tracking-widest text-muted mb-3">Try an example</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {EXAMPLE_PROMPTS.map((example, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setPrompt(example.text)}
                    className="text-left p-4 bg-surface hover:bg-surface-high border border-border rounded-lg transition-all duration-200 hover:border-primary"
                  >
                    <p className="text-sm font-semibold text-foreground mb-1">{example.title}</p>
                    <p className="text-xs text-muted line-clamp-2">{example.text}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage: Generating */}
        {stage === 'generating' && (
          <motion.div key="generating" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="bg-surface border border-border rounded-lg p-8 text-center bloom-shadow">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-headline font-bold text-foreground mb-2 uppercase tracking-tight">Generating Animation</h2>
              <p className="text-sm text-muted mb-2">Building your scene with AI video + voice generation...</p>
              <p className="text-xs text-muted/50 mb-6 font-label">This takes 5-15 minutes on RTX A4000. Please be patient.</p>

              <div className="max-w-sm mx-auto space-y-2 mb-6">
                {[
                  { label: 'Parsing scene description', icon: '1' },
                  { label: `Generating ${settings.num_clips} video clips`, icon: '2' },
                  { label: 'Creating AI voiceover', icon: '3' },
                  { label: 'Stitching final video', icon: '4' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-left">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold font-label">{step.icon}</div>
                    <span className="text-xs text-muted">{step.label}</span>
                  </div>
                ))}
              </div>

              <div className="max-w-md mx-auto bg-surface-high rounded-lg p-4 text-left border border-border">
                <p className="text-xs text-muted font-label">Prompt: {prompt.length > 120 ? prompt.slice(0, 120) + '...' : prompt}</p>
                <p className="text-xs text-muted/50 font-label mt-1">
                  {settings.num_clips} clips &times; {settings.num_frames_per_segment} frames @ {settings.fps}fps = ~{estimatedDuration.toFixed(0)}s &middot; Voice: {settings.voice_preset}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage: Preview */}
        {stage === 'preview' && videoUrl && (
          <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
            <div className="bg-surface border border-border rounded-lg overflow-hidden bloom-shadow">
              <div className="relative bg-void-black aspect-video">
                <video ref={videoRef} src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-headline font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
                      Generated Animation
                      {videoMeta?.has_audio !== false && <Volume2 className="h-4 w-4 text-accent" />}
                    </h2>
                    {videoMeta && (
                      <p className="text-xs text-muted mt-1 font-label">
                        {videoMeta.duration}s &middot; {videoMeta.num_segments} clips &middot; {videoMeta.fps}fps
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleNewVideo} className="text-muted hover:text-foreground">
                      <RotateCcw className="h-4 w-4 mr-2" />New Animation
                    </Button>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />Download MP4
                    </Button>
                  </div>
                </div>
                {videoMeta?.scene && (
                  <div className="mt-4 p-3 bg-surface-high rounded-lg border border-border">
                    <p className="text-[10px] font-label text-muted uppercase tracking-widest mb-1">Scene parsed:</p>
                    <p className="text-sm text-foreground">{videoMeta.scene.title || 'Untitled Scene'}</p>
                    {videoMeta.scene.objects?.length > 0 && (
                      <p className="text-xs text-muted mt-1 font-label">Objects: {videoMeta.scene.objects.map((o: any) => o.name).join(', ')}</p>
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
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-label font-medium uppercase tracking-widest transition-colors ${
              status === 'completed' ? 'bg-accent/20 text-accent' :
              status === 'active' ? 'bg-primary/20 text-primary ring-1 ring-primary/50' :
              'bg-surface-high text-muted'
            }`}>
              {status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px]">{i + 1}</span>}
              {step.label}
            </div>
            {i < steps.length - 1 && <div className={`w-8 h-px ${status === 'completed' ? 'bg-accent/50' : 'bg-border'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function SettingInput({ label, value, onChange, min, max, step = 1, hint }: {
  label: string; value: number; onChange: (val: number) => void; min: number; max: number; step?: number; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1 font-label uppercase tracking-widest">
        {label} {hint && <span className="text-muted/50 normal-case tracking-normal">({hint})</span>}
      </label>
      <input
        type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        min={min} max={max} step={step}
        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
      />
    </div>
  );
}

const EXAMPLE_PROMPTS = [
  { title: 'Garden Cat', text: 'A cute orange tabby cat walking through a sunlit garden with colorful flowers. The cat looks around curiously and says "What a beautiful day!" with a happy expression.' },
  { title: 'Robot Dance', text: 'A friendly robot dancing on a futuristic stage with colorful spotlights. The robot says "Watch my moves!" with an excited tone.' },
  { title: 'Ocean Sunset', text: 'A cinematic aerial view of turquoise ocean waves crashing on a sandy beach at sunset, golden light reflecting on the water.' },
  { title: 'Knight\'s Quest', text: 'A knight in shining armor approaches a castle gate and says "Open the gates!" with an urgent expression. Epic medieval atmosphere.' },
  { title: 'Space Journey', text: 'A spacecraft flying through a colorful nebula in deep space, stars twinkling, cinematic camera slowly rotating around the ship.' },
  { title: 'Forest Walk', text: 'Walking through a misty enchanted forest with rays of sunlight filtering through tall ancient trees. A narrator says "In the heart of the forest, magic awaits."' },
];
