'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Loader2, CheckCircle2, Star, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { feedbackAPI } from '@/lib/api';

type Category = 'bug' | 'suggestion' | 'praise' | 'other';

const CATEGORY_LABELS: Record<Category, string> = {
  bug: 'Bug Report',
  suggestion: 'Suggestion',
  praise: 'Praise',
  other: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  read: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  resolved: 'bg-success/10 text-success border-success/20',
};

export default function FeedbackPage() {
  const [category, setCategory] = useState<Category>('suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadMine = async () => {
    setLoadingHistory(true);
    try {
      const res = await feedbackAPI.getMine();
      setHistory(res.data?.data?.feedback || []);
      setRatings(res.data?.data?.ratings || []);
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadMine();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await feedbackAPI.submitFeedback({
        subject: subject.trim(),
        message: message.trim(),
        category,
      });
      setSuccess(true);
      setSubject('');
      setMessage('');
      setCategory('suggestion');
      loadMine();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-12 px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-headline font-black tracking-tight text-foreground uppercase">
            Send <span className="text-accent">Feedback</span>
          </h1>
          <p className="text-muted mt-2">
            Tell us what's working, what's broken, or what you'd like to see.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="lg:col-span-3 bg-surface border border-border rounded-lg bloom-shadow p-8 space-y-6"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-headline font-bold uppercase tracking-tight">
                New Feedback
              </h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border">
                  {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Short summary"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={255}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe the issue, idea, or experience..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={5000}
                className="bg-input border-border text-foreground"
              />
              <p className="text-xs text-muted text-right">{message.length}/5000</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 p-3 bg-success/10 border border-success/20 rounded-lg text-sm text-success">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                Thanks! Your feedback has been received.
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:brightness-110"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </motion.form>

          {/* History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-surface border border-border rounded-lg bloom-shadow p-6">
              <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-foreground mb-4">
                Your Feedback
              </h3>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No feedback yet.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {history.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 bg-surface-high rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {f.subject}
                        </p>
                        <Badge className={`${STATUS_COLORS[f.status] || ''} text-[10px]`}>
                          {f.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted line-clamp-2">{f.message}</p>
                      <p className="text-[10px] text-muted/60 mt-1 uppercase tracking-widest">
                        {CATEGORY_LABELS[f.category as Category] || f.category} ·{' '}
                        {new Date(f.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface border border-border rounded-lg bloom-shadow p-6">
              <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-foreground mb-4">
                Your Ratings
              </h3>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted" />
                </div>
              ) : ratings.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No ratings yet.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {ratings.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 p-3 bg-surface-high rounded-lg border border-border"
                    >
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-widest text-muted">
                          {r.feature_type}
                        </p>
                        {r.comment && (
                          <p className="text-xs text-foreground line-clamp-1">{r.comment}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-3 w-3 ${
                              n <= r.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted/40'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
