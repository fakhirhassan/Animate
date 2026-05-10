/**
 * Global generation store
 *
 * Lets the user navigate away from a generation page (Animate / Text-to-Image
 * / 2D-to-3D) without aborting the in-flight request. The axios call is
 * started here, kept alive across route changes, and its result lands in
 * this store regardless of which page is currently mounted. Pages
 * subscribe to the matching slot to render progress / results.
 *
 * Scope: in-memory only. Survives navigation between dashboard pages.
 * Does NOT survive a hard reload — for that we'd need a backend job queue.
 */

import { create } from 'zustand';

export type JobKind = 'animate' | 'image' | '3d';

export type JobStatus = 'idle' | 'running' | 'success' | 'error';

export interface Job<TResult = any> {
  status: JobStatus;
  startedAt: number | null;
  finishedAt: number | null;
  prompt: string;          // user-facing label, e.g. the text prompt or filename
  result: TResult | null;  // shape is page-specific
  error: string | null;
}

const idleJob = (): Job => ({
  status: 'idle',
  startedAt: null,
  finishedAt: null,
  prompt: '',
  result: null,
  error: null,
});

interface GenerationState {
  jobs: Record<JobKind, Job>;
  start: (kind: JobKind, prompt: string) => void;
  succeed: (kind: JobKind, result: any) => void;
  fail: (kind: JobKind, error: string) => void;
  reset: (kind: JobKind) => void;
  /**
   * Run a generation request without tying its lifetime to the calling
   * component. Sets status=running, awaits the promise, stores the result,
   * and returns the promise so the caller can await it too if it's still
   * mounted. If the caller unmounts mid-flight, the promise still resolves
   * into the store and any other component subscribed to this kind will
   * see the result.
   */
  run: <T>(
    kind: JobKind,
    prompt: string,
    fn: () => Promise<T>,
  ) => Promise<T>;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  jobs: {
    animate: idleJob(),
    image: idleJob(),
    '3d': idleJob(),
  },

  start: (kind, prompt) =>
    set((s) => ({
      jobs: {
        ...s.jobs,
        [kind]: {
          status: 'running',
          startedAt: Date.now(),
          finishedAt: null,
          prompt,
          result: null,
          error: null,
        },
      },
    })),

  succeed: (kind, result) =>
    set((s) => ({
      jobs: {
        ...s.jobs,
        [kind]: {
          ...s.jobs[kind],
          status: 'success',
          finishedAt: Date.now(),
          result,
          error: null,
        },
      },
    })),

  fail: (kind, error) =>
    set((s) => ({
      jobs: {
        ...s.jobs,
        [kind]: {
          ...s.jobs[kind],
          status: 'error',
          finishedAt: Date.now(),
          error,
        },
      },
    })),

  reset: (kind) =>
    set((s) => ({ jobs: { ...s.jobs, [kind]: idleJob() } })),

  run: async (kind, prompt, fn) => {
    get().start(kind, prompt);
    try {
      const result = await fn();
      get().succeed(kind, result);
      return result;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Generation failed';
      get().fail(kind, msg);
      throw err;
    }
  },
}));

/** Convenience selector — true if any kind is currently running. */
export const selectAnyRunning = (s: GenerationState) =>
  Object.values(s.jobs).some((j) => j.status === 'running');
