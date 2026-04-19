'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Lock,
  Trash2,
  Database,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';

const IMAGE_HISTORY_KEY = 'mesh_image_history';
const VIDEO_HISTORY_KEY = 'mesh_video_history';

type ToastType = 'success' | 'error';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();

  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // --- Profile ---
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => { if (user?.name) setName(user.name); }, [user?.name]);

  const handleSaveProfile = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) { showToast('error', 'Name must be at least 2 characters'); return; }
    if (trimmed === user?.name) { showToast('error', 'No changes to save'); return; }
    setSavingProfile(true);
    try {
      await authAPI.updateProfile({ name: trimmed });
      if (user) setUser({ ...user, name: trimmed });
      showToast('success', 'Profile updated');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // --- Password ---
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) { showToast('error', 'Please fill all password fields'); return; }
    if (newPw !== confirmPw) { showToast('error', 'New passwords do not match'); return; }
    if (newPw.length < 6) { showToast('error', 'New password must be at least 6 characters'); return; }
    if (oldPw === newPw) { showToast('error', 'New password must be different'); return; }
    setChangingPw(true);
    try {
      await authAPI.changePassword({ old_password: oldPw, new_password: newPw, confirm_password: confirmPw });
      setOldPw(''); setNewPw(''); setConfirmPw('');
      showToast('success', 'Password changed successfully');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  // --- Local storage ---
  const [storageCounts, setStorageCounts] = useState({ images: 0, videos: 0 });
  useEffect(() => { refreshStorageCounts(); }, []);

  const refreshStorageCounts = () => {
    try {
      const imgs = JSON.parse(localStorage.getItem(IMAGE_HISTORY_KEY) || '[]').length;
      const vids = JSON.parse(localStorage.getItem(VIDEO_HISTORY_KEY) || '[]').length;
      setStorageCounts({ images: imgs, videos: vids });
    } catch {
      setStorageCounts({ images: 0, videos: 0 });
    }
  };

  const handleClearStorage = () => {
    if (!confirm('Clear all cached images and videos from this browser? (Backend files remain untouched.)')) return;
    localStorage.removeItem(IMAGE_HISTORY_KEY);
    localStorage.removeItem(VIDEO_HISTORY_KEY);
    refreshStorageCounts();
    showToast('success', 'Local history cleared');
  };

  // --- Delete account ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deletePassword) { showToast('error', 'Enter your password to confirm'); return; }
    setDeleting(true);
    try {
      await authAPI.deleteAccount({ password: deletePassword });
      localStorage.removeItem(IMAGE_HISTORY_KEY);
      localStorage.removeItem(VIDEO_HISTORY_KEY);
      logout();
      router.push('/login');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-headline font-black tracking-tight text-foreground uppercase">
            <span className="text-accent">Settings</span>
          </h1>
          <p className="text-muted mt-2">Manage your account and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-surface border border-border rounded-lg p-6 bloom-shadow"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-foreground uppercase tracking-tight">Profile</h2>
              <p className="text-xs text-muted">Your account information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input id="email" value={user?.email || ''} disabled className="bg-surface-high/50 cursor-not-allowed" />
                <Badge variant="info">Cannot change</Badge>
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <div className="mt-1.5">
                <Badge variant={user?.role === 'admin' ? 'admin' : 'default'} className="capitalize">
                  {user?.role || 'creator'}
                </Badge>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleSaveProfile} disabled={savingProfile || name.trim() === user?.name}>
                {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Password Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-lg p-6 bloom-shadow"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-highlight/20 rounded-lg flex items-center justify-center">
              <Lock className="h-5 w-5 text-highlight" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-foreground uppercase tracking-tight">Change Password</h2>
              <p className="text-xs text-muted">Update your account password</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="old-pw">Current Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="old-pw"
                  type={showPw ? 'text' : 'password'}
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="new-pw">New Password</Label>
              <Input
                id="new-pw"
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="confirm-pw">Confirm New Password</Label>
              <Input
                id="confirm-pw"
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter new password"
                className="mt-1.5"
              />
              {confirmPw && newPw && confirmPw !== newPw && (
                <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Passwords do not match
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button onClick={handleChangePassword} disabled={changingPw}>
                {changingPw ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                Change Password
              </Button>
            </div>
          </div>
        </motion.section>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Local Storage Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface border border-border rounded-lg p-6 bloom-shadow"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-foreground uppercase tracking-tight">Local Cache</h2>
              <p className="text-xs text-muted">Clear cached images and videos from this browser</p>
            </div>
          </div>

          <div className="bg-surface-high/50 rounded-lg p-4 mb-4 border border-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-label uppercase tracking-widest text-muted">Cached Images</p>
                <p className="text-2xl font-bold text-foreground">{storageCounts.images}</p>
              </div>
              <div>
                <p className="text-[10px] font-label uppercase tracking-widest text-muted">Cached Videos</p>
                <p className="text-2xl font-bold text-foreground">{storageCounts.videos}</p>
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={handleClearStorage} disabled={storageCounts.images === 0 && storageCounts.videos === 0}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear Local Cache
          </Button>
        </motion.section>

        {/* Danger Zone */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border-2 border-destructive/30 rounded-lg p-6 bloom-shadow"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-destructive uppercase tracking-tight">Danger Zone</h2>
              <p className="text-xs text-muted">Irreversible account actions</p>
            </div>
          </div>

          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Delete Account</h3>
              <p className="text-xs text-muted mt-0.5">Permanently delete your account and all associated data</p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteModalOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Account
            </Button>
          </div>
        </motion.section>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-void-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-surface border-2 border-destructive/50 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline text-lg font-bold text-destructive uppercase tracking-tight">Delete Account</h3>
                <Button variant="ghost" size="sm" onClick={() => !deleting && setDeleteModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-foreground mb-2">This action is <span className="font-bold text-destructive">permanent</span> and cannot be undone.</p>
              <p className="text-xs text-muted mb-5">Your account, all 3D models, images, and videos will be deleted from our servers.</p>

              <Label htmlFor="delete-pw">Enter your password to confirm</Label>
              <Input
                id="delete-pw"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Password"
                className="mt-1.5 mb-5"
                disabled={deleting}
              />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting || !deletePassword}>
                  {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Permanently Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${
              toast.type === 'success'
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <p className="text-sm font-medium">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
