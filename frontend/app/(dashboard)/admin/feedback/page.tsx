'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Star,
  ArrowLeft,
  Loader2,
  Filter,
  CheckCircle2,
  Eye,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  read: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  resolved: 'bg-success/10 text-success border-success/20',
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  suggestion: 'Suggestion',
  praise: 'Praise',
  other: 'Other',
};

const FEATURE_LABELS: Record<string, string> = {
  't2v': 'Animation',
  't2i': 'Image',
  '2d-to-3d': '2D→3D',
  'tts': 'Voice',
  'video-edit': 'Edit',
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(true);

  const [feedback, setFeedback] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<any>(null);
  const [ratingsSummary, setRatingsSummary] = useState<any>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [featureFilter, setFeatureFilter] = useState<string>('all');

  const [selected, setSelected] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token || !user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/creator');
      return;
    }
    setAuthChecking(false);
  }, [hasHydrated, token, user, router]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fbRes, fbSumRes, rtRes, rtSumRes] = await Promise.all([
        adminAPI.getFeedback({
          limit: 100,
          status: statusFilter === 'all' ? undefined : statusFilter,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
        }),
        adminAPI.getFeedbackSummary(),
        adminAPI.getRatings({
          limit: 100,
          feature_type: featureFilter === 'all' ? undefined : featureFilter,
        }),
        adminAPI.getRatingsSummary(),
      ]);
      setFeedback(fbRes.data?.data?.feedback || []);
      setFeedbackSummary(fbSumRes.data?.data || null);
      setRatings(rtRes.data?.data?.ratings || []);
      setRatingsSummary(rtSumRes.data?.data || null);
    } catch (e) {
      console.error('Failed to load admin feedback data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecking) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecking, statusFilter, categoryFilter, featureFilter]);

  const handleOpenDetails = async (item: any) => {
    setSelected(item);
    setAdminNotes(item.admin_notes || '');
    if (item.status === 'new') {
      try {
        await adminAPI.updateFeedback(item.id, { status: 'read' });
        setFeedback((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'read' } : f)),
        );
      } catch {}
    }
  };

  const handleSaveDetails = async (newStatus?: string) => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminAPI.updateFeedback(selected.id, {
        status: newStatus,
        admin_notes: adminNotes,
      });
      setFeedback((prev) =>
        prev.map((f) =>
          f.id === selected.id
            ? { ...f, admin_notes: adminNotes, status: newStatus || f.status }
            : f,
        ),
      );
      setSelected(null);
      fetchAll();
    } catch (e) {
      console.error('Failed to update feedback:', e);
    } finally {
      setSaving(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Build distribution chart data: per feature, count per star bucket.
  const distributionData = (ratingsSummary?.per_feature || []).map((f: any) => ({
    feature: FEATURE_LABELS[f.feature_type] || f.feature_type,
    '1★': f.distribution?.[1] || 0,
    '2★': f.distribution?.[2] || 0,
    '3★': f.distribution?.[3] || 0,
    '4★': f.distribution?.[4] || 0,
    '5★': f.distribution?.[5] || 0,
    avg: f.average,
  }));

  return (
    <div className="min-h-screen pt-12 pb-12 px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-start justify-between"
        >
          <div>
            <h1 className="text-4xl font-headline font-black tracking-tight text-foreground uppercase">
              Feedback & <span className="text-accent">Ratings</span>
            </h1>
            <p className="text-muted mt-2">
              User feedback submissions and per-feature rating analytics.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <SummaryCard
            label="Avg Rating"
            value={ratingsSummary?.overall_average?.toFixed(2) || '0.00'}
            sub={`${ratingsSummary?.total_ratings || 0} total ratings`}
            icon={<Star className="h-5 w-5 text-yellow-400" />}
          />
          <SummaryCard
            label="Total Feedback"
            value={`${feedbackSummary?.total || 0}`}
            sub={`${feedbackSummary?.unresolved || 0} unresolved`}
            icon={<MessageSquare className="h-5 w-5 text-primary" />}
          />
          <SummaryCard
            label="New / Unread"
            value={`${feedbackSummary?.by_status?.new || 0}`}
            sub="needs triage"
            icon={<Inbox className="h-5 w-5 text-accent" />}
          />
          <SummaryCard
            label="Resolved"
            value={`${feedbackSummary?.by_status?.resolved || 0}`}
            sub="closed out"
            icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          />
        </div>

        {/* Per-feature averages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-lg bloom-shadow p-8 mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-headline font-bold text-foreground uppercase tracking-tight mb-1">
                Rating Distribution
              </h3>
              <p className="text-muted text-sm">Stars per feature type</p>
            </div>
          </div>
          {distributionData.length === 0 ? (
            <p className="text-sm text-muted text-center py-12">No ratings yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="feature" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <Legend />
                <Bar dataKey="1★" stackId="a" fill="#EF4444" />
                <Bar dataKey="2★" stackId="a" fill="#F59E0B" />
                <Bar dataKey="3★" stackId="a" fill="#FACC15" />
                <Bar dataKey="4★" stackId="a" fill="#10F0B0" />
                <Bar dataKey="5★" stackId="a" fill="#6D28D9" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            {(ratingsSummary?.per_feature || []).map((f: any) => (
              <div
                key={f.feature_type}
                className="p-3 bg-surface-high rounded-lg border border-border"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted">
                  {FEATURE_LABELS[f.feature_type] || f.feature_type}
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-2xl font-bold text-accent">{f.average}</p>
                  <p className="text-xs text-muted">/ 5</p>
                </div>
                <p className="text-[10px] text-muted/60">{f.count} ratings</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-lg bloom-shadow p-6 mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="h-4 w-4 text-muted" />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'new', label: 'New' },
                { value: 'read', label: 'Read' },
                { value: 'resolved', label: 'Resolved' },
              ]}
            />
            <FilterSelect
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'bug', label: 'Bug' },
                { value: 'suggestion', label: 'Suggestion' },
                { value: 'praise', label: 'Praise' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <FilterSelect
              label="Rating Feature"
              value={featureFilter}
              onChange={setFeatureFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 't2v', label: 'Animation' },
                { value: 't2i', label: 'Image' },
                { value: '2d-to-3d', label: '2D→3D' },
                { value: 'tts', label: 'Voice' },
                { value: 'video-edit', label: 'Edit' },
              ]}
            />
          </div>
        </motion.div>

        {/* Feedback table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-lg bloom-shadow mb-10"
        >
          <div className="border-b border-border p-6">
            <h2 className="text-xl font-bold text-foreground">Feedback Submissions</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted" />
              </div>
            ) : feedback.length === 0 ? (
              <p className="text-sm text-muted text-center py-12">No feedback found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted font-medium">User</TableHead>
                      <TableHead className="text-muted font-medium">Subject</TableHead>
                      <TableHead className="text-muted font-medium">Category</TableHead>
                      <TableHead className="text-muted font-medium">Status</TableHead>
                      <TableHead className="text-muted font-medium">Submitted</TableHead>
                      <TableHead className="text-muted font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.map((f) => (
                      <TableRow key={f.id} className="border-border hover:bg-surface-high">
                        <TableCell>
                          <div>
                            <p className="text-foreground font-medium">{f.users?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted">{f.users?.email || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground max-w-xs truncate">
                          {f.subject}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-primary/10 text-primary border-primary/20 capitalize">
                            {CATEGORY_LABELS[f.category] || f.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[f.status] || ''}>
                            {f.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted text-sm">
                          {new Date(f.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetails(f)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent ratings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-lg bloom-shadow"
        >
          <div className="border-b border-border p-6">
            <h2 className="text-xl font-bold text-foreground">Recent Ratings</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted" />
              </div>
            ) : ratings.length === 0 ? (
              <p className="text-sm text-muted text-center py-12">No ratings found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted font-medium">User</TableHead>
                      <TableHead className="text-muted font-medium">Feature</TableHead>
                      <TableHead className="text-muted font-medium">Rating</TableHead>
                      <TableHead className="text-muted font-medium">Comment</TableHead>
                      <TableHead className="text-muted font-medium">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratings.map((r) => (
                      <TableRow key={r.id} className="border-border hover:bg-surface-high">
                        <TableCell>
                          <div>
                            <p className="text-foreground font-medium">
                              {r.users?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted">{r.users?.email || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-accent/10 text-accent border-accent/20">
                            {FEATURE_LABELS[r.feature_type] || r.feature_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                className={`h-4 w-4 ${
                                  n <= r.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted/40'
                                }`}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted text-sm max-w-md truncate">
                          {r.comment || <span className="italic text-muted/50">—</span>}
                        </TableCell>
                        <TableCell className="text-muted text-sm">
                          {new Date(r.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Details dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="bg-surface border-border text-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
            <DialogDescription className="text-muted">
              From {selected?.users?.name || 'Unknown'} ·{' '}
              {selected && new Date(selected.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="py-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 capitalize">
                  {CATEGORY_LABELS[selected.category] || selected.category}
                </Badge>
                <Badge className={STATUS_COLORS[selected.status] || ''}>
                  {selected.status}
                </Badge>
              </div>

              <div className="p-4 bg-surface-high border border-border rounded-lg">
                <p className="text-[10px] uppercase tracking-widest text-muted mb-2">
                  Message
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selected.message}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted mb-2">
                  Admin Notes
                </p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder="Internal notes (only visible to admins)"
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              className="border-border text-muted hover:bg-surface-high"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSaveDetails()}
              disabled={saving}
              className="border-border"
            >
              Save Notes
            </Button>
            {selected?.status !== 'resolved' && (
              <Button
                onClick={() => handleSaveDetails('resolved')}
                disabled={saving}
                className="bg-success hover:brightness-110"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 bloom-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="font-label text-[10px] uppercase tracking-widest text-muted">
          {label}
        </p>
        {icon}
      </div>
      <p className="text-3xl font-headline font-bold text-accent">{value}</p>
      <p className="text-xs text-muted mt-1">{sub}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-widest text-muted">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-input border-border text-foreground w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-surface border-border">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
