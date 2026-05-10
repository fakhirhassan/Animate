'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { feedbackAPI, FeatureType } from '@/lib/api';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureType: FeatureType;
  conversionId?: string;
  // Optional separate key for tracking "already rated" locally when there
  // is no conversionId (e.g. text-to-image, where the image url is unique
  // per generation but isn't a UUID we can send to the backend).
  itemKey?: string;
  title?: string;
  onSubmitted?: () => void;
}

const RATED_STORAGE_KEY = 'mesh-rated-items';

function getRatedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(RATED_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markRated(key: string) {
  if (typeof window === 'undefined') return;
  const set = getRatedSet();
  set.add(key);
  try {
    localStorage.setItem(RATED_STORAGE_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new Event('mesh-rated-change'));
  } catch {}
}

export function ratedKeyFor(featureType: FeatureType, idOrKey?: string) {
  return `${featureType}:${idOrKey || 'no-id'}`;
}

export function useHasRated(featureType: FeatureType, idOrKey?: string) {
  const [rated, setRated] = useState(false);
  useEffect(() => {
    const check = () => {
      const set = getRatedSet();
      setRated(set.has(ratedKeyFor(featureType, idOrKey)));
    };
    check();
    window.addEventListener('mesh-rated-change', check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener('mesh-rated-change', check);
      window.removeEventListener('storage', check);
    };
  }, [featureType, idOrKey]);
  return rated;
}

const FEATURE_LABEL: Record<FeatureType, string> = {
  't2v': 'this animation',
  't2i': 'this image',
  '2d-to-3d': 'this 3D model',
  'tts': 'this voice clip',
  'video-edit': 'this edited video',
};

export default function RatingDialog({
  open,
  onOpenChange,
  featureType,
  conversionId,
  itemKey,
  title,
  onSubmitted,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRating(0);
    setHover(0);
    setComment('');
    setError(null);
    setSubmitting(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (rating < 1) {
      setError('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await feedbackAPI.submitRating({
        feature_type: featureType,
        rating,
        conversion_id: conversionId,
        comment: comment.trim() || undefined,
      });
      markRated(ratedKeyFor(featureType, itemKey || conversionId));
      onSubmitted?.();
      handleClose(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const display = hover || rating;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-surface border-border text-foreground">
        <DialogHeader>
          <DialogTitle>{title || `Rate ${FEATURE_LABEL[featureType]}`}</DialogTitle>
          <DialogDescription className="text-muted">
            Your rating helps us improve generation quality.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div
            className="flex items-center justify-center gap-2"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
              >
                <Star
                  className={`h-9 w-9 ${
                    n <= display ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
                  }`}
                />
              </button>
            ))}
          </div>
          {display > 0 && (
            <p className="text-center text-sm text-muted">
              {['Poor', 'Fair', 'Good', 'Great', 'Excellent'][display - 1]}
            </p>
          )}

          <Textarea
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="bg-input border-border text-foreground"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            className="border-border text-muted hover:bg-surface-high"
            disabled={submitting}
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating < 1}
            className="bg-primary hover:brightness-110"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting
              </>
            ) : (
              'Submit Rating'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
