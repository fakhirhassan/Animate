'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Video,
  TrendingUp,
  Activity,
  UserCheck,
  MoreVertical,
  Search,
  LogOut,
  Plus,
  Shield,
  Zap,
  Database,
  BarChart3,
  UserPlus,
  FileVideo,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, RadialBarChart, RadialBar,
} from 'recharts';
import { Trophy, Clock, Target, Award, TrendingDown, Sparkles, MessageSquare } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, token, hasHydrated } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    systemHealth: 100,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [conversionData, setConversionData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [conversionStatus, setConversionStatus] = useState<any[]>([]);
  const [topCreators, setTopCreators] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>({
    newUsersWeek: 0,
    newUsersChange: 0,
    conversionsWeek: 0,
    conversionsChange: 0,
    successRate: 0,
    totalConversions: 0,
  });

  // Range selectors for analytics charts
  const [activityRangeDays, setActivityRangeDays] = useState<number>(7);
  const [growthRangeMonths, setGrowthRangeMonths] = useState<number>(6);

  // CRUD state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'creator',
    status: 'active',
  });

  // Check authentication and admin role. Wait for persist hydration first
  // (otherwise the first render sees null user/token and bounces to /login
  // even though localStorage has a valid session).
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
    setIsAuthChecking(false);
  }, [hasHydrated, token, user, router]);

  useEffect(() => {
    if (!isAuthChecking && user && user.role === 'admin') {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthChecking, user, activityRangeDays, growthRangeMonths]);

  const fetchDashboardData = async () => {
    try {
      console.log('📊 Fetching admin dashboard data...');

      // Fetch stats from backend
      const statsResponse = await adminAPI.getSystemStats();
      console.log('✅ Stats response:', statsResponse.data);

      const statsData = statsResponse?.data?.data || {};
      console.log('📈 Stats data:', statsData);
      console.log('📊 Total Projects:', statsData.totalProjects);

      setStats({
        totalUsers: statsData.totalUsers || 0,
        activeUsers: statsData.activeUsers || 0,
        totalProjects: statsData.totalProjects || 0,
        systemHealth: statsData.systemHealth || 0,
      });

      // Fetch users from backend
      const usersResponse = await adminAPI.getUsers();
      console.log('👥 Users response:', usersResponse.data);
      setUsers(usersResponse?.data?.data?.users || []);

      // All analytics in parallel — each independently caught so one failure
      // doesn't blank out unrelated charts.
      const [
        growthRes, activityRes, roleRes, statusRes, topRes, heatRes, overviewRes, activitiesRes,
      ] = await Promise.all([
        adminAPI.getUserGrowth(growthRangeMonths).catch((e) => { console.error('userGrowth failed', e); return { data: { data: [] } }; }),
        adminAPI.getConversionActivity(activityRangeDays).catch((e) => { console.error('conversionActivity failed', e); return { data: { data: [] } }; }),
        adminAPI.getRoleDistribution().catch((e) => { console.error('roleDistribution failed', e); return { data: { data: [] } }; }),
        adminAPI.getConversionStatus().catch((e) => { console.error('conversionStatus failed', e); return { data: { data: [] } }; }),
        adminAPI.getTopCreators(5).catch((e) => { console.error('topCreators failed', e); return { data: { data: [] } }; }),
        adminAPI.getHeatmap(activityRangeDays).catch((e) => { console.error('heatmap failed', e); return { data: { data: [] } }; }),
        adminAPI.getOverview().catch((e) => { console.error('overview failed', e); return { data: { data: {} } }; }),
        adminAPI.getRecentActivities(10).catch((e) => { console.error('recentActivities failed', e); return { data: { data: [] } }; }),
      ]);

      console.log('[admin] activity len:', (activityRes.data?.data || []).length, activityRes.data?.data);
      console.log('[admin] status len:', (statusRes.data?.data || []).length, statusRes.data?.data);
      console.log('[admin] top creators len:', (topRes.data?.data || []).length, topRes.data?.data);
      setUserGrowthData(growthRes.data?.data || []);
      setConversionData(activityRes.data?.data || []);
      setRoleDistribution(roleRes.data?.data || []);
      setConversionStatus(statusRes.data?.data || []);
      setTopCreators(topRes.data?.data || []);
      setHeatmapData(heatRes.data?.data || []);
      if (overviewRes.data?.data) setOverview({ ...overview, ...overviewRes.data.data });

      const activities = (activitiesRes.data?.data || []).map((activity: any) => ({
        ...activity,
        icon: activity.type === 'signup' ? UserPlus :
              activity.type === 'alert' ? AlertCircle : FileVideo
      }));
      setRecentActivities(activities);

      console.log('✅ All dashboard data fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fmtChange = (n: number) => `${n >= 0 ? '+' : ''}${n}%`;

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      iconColor: 'text-primary',
      change: fmtChange(overview.newUsersChange || 0),
      changeType: (overview.newUsersChange || 0) >= 0 ? 'positive' : 'negative',
      sub: `${overview.newUsersWeek || 0} new this week`,
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: UserCheck,
      iconColor: 'text-accent',
      change: `${stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%`,
      changeType: 'positive',
      sub: 'of total user base',
    },
    {
      title: 'Total Projects',
      value: stats.totalProjects.toLocaleString(),
      icon: Video,
      iconColor: 'text-primary',
      change: fmtChange(overview.conversionsChange || 0),
      changeType: (overview.conversionsChange || 0) >= 0 ? 'positive' : 'negative',
      sub: `${overview.conversionsWeek || 0} this week`,
    },
    {
      title: 'Success Rate',
      value: `${overview.successRate || 0}%`,
      icon: Target,
      iconColor: 'text-accent',
      change: `${overview.totalConversions || 0}`,
      changeType: 'positive',
      sub: 'total conversions',
    },
  ];

  const ROLE_COLORS = ['#6D28D9', '#10F0B0'];
  const STATUS_COLORS: Record<string, string> = {
    Completed: '#10F0B0',
    Processing: '#F59E0B',
    Failed: '#EF4444',
    Pending: '#6366F1',
    Unknown: '#6B7280',
  };

  const maxHeat = Math.max(1, ...heatmapData.map((d: any) => d.value || 0));
  const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatCellColor = (v: number) => {
    if (v === 0) return 'bg-surface-high border-border';
    const intensity = v / maxHeat;
    if (intensity > 0.75) return 'bg-primary border-primary/50';
    if (intensity > 0.5) return 'bg-primary/70 border-primary/40';
    if (intensity > 0.25) return 'bg-primary/40 border-primary/30';
    return 'bg-primary/20 border-primary/20';
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleGenerateReport = () => {
    // Bundle the data we already have into a CSV the admin can save / share.
    // No new backend call — uses the same numbers shown on screen.
    const csvEscape = (v: any) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines: string[] = [];
    const generatedAt = new Date().toISOString();

    lines.push(`MESH Admin Report,Generated ${generatedAt}`);
    lines.push('');

    lines.push('# System Overview');
    lines.push('Metric,Value');
    lines.push(`Total Users,${stats.totalUsers}`);
    lines.push(`Active Users (last 7 days),${stats.activeUsers}`);
    lines.push(`Total Projects,${stats.totalProjects}`);
    lines.push(`System Health,${stats.systemHealth}%`);
    lines.push(`New Users This Week,${overview.newUsersWeek} (${overview.newUsersChange >= 0 ? '+' : ''}${overview.newUsersChange}% vs last week)`);
    lines.push(`Conversions This Week,${overview.conversionsWeek} (${overview.conversionsChange >= 0 ? '+' : ''}${overview.conversionsChange}% vs last week)`);
    lines.push(`Success Rate,${overview.successRate}%`);
    lines.push('');

    lines.push('# User Growth (last 6 months)');
    lines.push('Month,New Users');
    userGrowthData.forEach((row: any) => lines.push(`${csvEscape(row.month)},${row.users ?? 0}`));
    lines.push('');

    lines.push('# Conversion Activity (last 7 days)');
    lines.push('Day,Conversions');
    conversionData.forEach((row: any) => lines.push(`${csvEscape(row.day)},${row.conversions ?? 0}`));
    lines.push('');

    lines.push('# User Roles');
    lines.push('Role,Count');
    roleDistribution.forEach((row: any) => lines.push(`${csvEscape(row.name)},${row.value ?? 0}`));
    lines.push('');

    lines.push('# Conversion Status Breakdown');
    lines.push('Status,Count');
    conversionStatus.forEach((row: any) => lines.push(`${csvEscape(row.name)},${row.value ?? 0}`));
    lines.push('');

    lines.push('# Top Creators');
    lines.push('Name,Email,Conversions');
    topCreators.forEach((row: any) =>
      lines.push(`${csvEscape(row.name)},${csvEscape(row.email)},${row.count ?? 0}`),
    );

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mesh-admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // CRUD Handlers
  const handleAddUser = () => {
    setFormData({ name: '', email: '', role: 'creator', status: 'active' });
    setIsAddDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await adminAPI.updateUser(userId, { status: newStatus });

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status');
    }
  };

  const confirmAddUser = async () => {
    try {
      // Create a dummy user with generated ID
      const newUser = {
        id: `user_${Date.now()}`,
        ...formData,
        projects: 0,
        joinedAt: new Date().toLocaleDateString(),
      };

      setUsers([newUser, ...users]);
      setIsAddDialogOpen(false);
      setFormData({ name: '', email: '', role: 'creator', status: 'active' });
    } catch (error) {
      console.error('Failed to add user:', error);
      alert('Failed to add user');
    }
  };

  const confirmEditUser = async () => {
    try {
      if (!selectedUser) return;

      await adminAPI.updateUser(selectedUser.id, formData);

      // Update local state
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  };

  const confirmDeleteUser = async () => {
    try {
      if (!selectedUser) return;

      await adminAPI.deleteUser(selectedUser.id);

      // Remove from local state
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  // Show loading state while checking authentication
  if (isAuthChecking || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-8 relative bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex items-start justify-between"
        >
          <div>
            <h1 className="text-4xl font-headline font-black tracking-tight text-foreground uppercase">
              Admin <span className="text-accent">Dashboard</span>
            </h1>
            <p className="text-muted mt-2">
              Welcome back, {user?.name}. System diagnostics and user management.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push('/admin/feedback')}
              variant="outline"
              className="group"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline font-label text-xs uppercase tracking-widest">Feedback & Ratings</span>
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="group"
            >
              <span className="hidden sm:inline font-label text-xs uppercase tracking-widest">{user?.name}</span>
              <LogOut className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
        >
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group"
              >
                <div className="bg-surface border border-border rounded-lg p-8 bloom-shadow hover:border-primary transition-all duration-300 h-full">
                  {/* Icon with subtle background */}
                  <div className={`w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-7 w-7 ${stat.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <p className="font-label text-[10px] uppercase tracking-widest text-muted">{stat.title}</p>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-headline font-bold text-accent">{stat.value}</p>
                      <span className={`text-xs font-label px-2 py-1 rounded flex items-center gap-1 ${
                        stat.changeType === 'positive'
                          ? 'text-accent bg-accent/10'
                          : 'text-destructive bg-destructive/10'
                      }`}>
                        {stat.changeType === 'positive'
                          ? <TrendingUp className="h-3 w-3" />
                          : <TrendingDown className="h-3 w-3" />}
                        {stat.change}
                      </span>
                    </div>
                    {(stat as any).sub && (
                      <p className="text-xs text-muted mt-1">{(stat as any).sub}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Analytics and Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Analytics Section - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Growth Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-border rounded-lg bloom-shadow p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-headline font-bold text-foreground uppercase tracking-tight mb-1">User Growth</h3>
                  <p className="text-muted text-sm">Monthly user acquisition trend</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={String(growthRangeMonths)}
                    onValueChange={(v) => setGrowthRangeMonths(Number(v))}
                  >
                    <SelectTrigger className="w-32 bg-input border-border text-foreground text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-border">
                      <SelectItem value="3">Last 3 months</SelectItem>
                      <SelectItem value="6">Last 6 months</SelectItem>
                      <SelectItem value="12">Last 12 months</SelectItem>
                      <SelectItem value="24">Last 24 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6D28D9" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#6D28D9" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#6D28D9"
                    strokeWidth={3}
                    fill="url(#userGrowthFill)"
                    dot={{ fill: '#10F0B0', r: 5, strokeWidth: 2, stroke: '#6D28D9' }}
                    activeDot={{ r: 7 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* 2D to 3D Conversions Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface border border-border rounded-lg bloom-shadow p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-headline font-bold text-foreground uppercase tracking-tight mb-1">Conversions</h3>
                  <p className="text-muted text-sm">Conversion activity over time</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={String(activityRangeDays)}
                    onValueChange={(v) => setActivityRangeDays(Number(v))}
                  >
                    <SelectTrigger className="w-32 bg-input border-border text-foreground text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-border">
                      <SelectItem value="7">Last week</SelectItem>
                      <SelectItem value="14">Last 2 weeks</SelectItem>
                      <SelectItem value="30">Last month</SelectItem>
                      <SelectItem value="90">Last 3 months</SelectItem>
                      <SelectItem value="180">Last 6 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)'
                    }}
                  />
                  <Bar
                    dataKey="conversions"
                    fill="url(#colorGradient)"
                    radius={[8, 8, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10F0B0" />
                      <stop offset="100%" stopColor="#6D28D9" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-border rounded-lg bloom-shadow p-6"
            >
              <h3 className="text-lg font-headline font-bold text-foreground uppercase tracking-tight mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button className="w-full justify-start" onClick={handleGenerateReport}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-border"
                  onClick={() => router.push('/admin/feedback')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback & Ratings
                </Button>
              </div>
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface border border-border rounded-lg bloom-shadow p-6"
            >
              <h3 className="text-lg font-headline font-bold text-foreground uppercase tracking-tight mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-accent" />
                System Status
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted">CPU Usage</span>
                    <span className="text-sm font-medium text-foreground">45%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted">Memory</span>
                    <span className="text-sm font-medium text-foreground">68%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted">Storage</span>
                    <span className="text-sm font-medium text-foreground">32%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-surface border border-border rounded-lg bloom-shadow p-6"
            >
              <h3 className="text-lg font-headline font-bold text-foreground uppercase tracking-tight mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </h3>
              <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 bg-surface-high rounded-xl border border-border hover:border-primary/30 transition-all duration-300">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'alert' ? 'bg-destructive/20' :
                        activity.type === 'signup' ? 'bg-accent/20' :
                        'bg-primary/20'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          activity.type === 'alert' ? 'text-destructive' :
                          activity.type === 'signup' ? 'text-accent' :
                          'text-primary'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.user}</p>
                        <p className="text-xs text-muted truncate">{activity.action}</p>
                        <p className="text-xs text-muted/50 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Advanced Analytics Row 1: Donuts + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Role Distribution Donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-surface border border-border rounded-lg bloom-shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-headline font-bold text-foreground uppercase tracking-tight">User Roles</h3>
                <p className="text-muted text-xs">Distribution by access level</p>
              </div>
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {roleDistribution.map((_, idx) => (
                    <Cell key={idx} fill={ROLE_COLORS[idx % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {roleDistribution.map((r: any, i: number) => (
                <div key={i} className="bg-surface-high rounded-lg p-3 border border-border">
                  <p className="text-[10px] uppercase tracking-widest text-muted">{r.name}</p>
                  <p className="text-xl font-bold text-foreground">{r.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Conversion Status Donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface border border-border rounded-lg bloom-shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-headline font-bold text-foreground uppercase tracking-tight">Conversion Status</h3>
                <p className="text-muted text-xs">Success vs processing vs failed</p>
              </div>
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={conversionStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {conversionStatus.map((entry: any, idx: number) => (
                    <Cell key={idx} fill={STATUS_COLORS[entry.name] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="bg-surface-high rounded-lg p-3 border border-border mt-2 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted">Overall Success Rate</p>
              <p className="text-2xl font-bold text-accent">{overview.successRate || 0}%</p>
            </div>
          </motion.div>

          {/* Top Creators Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-surface border border-border rounded-lg bloom-shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-headline font-bold text-foreground uppercase tracking-tight">Top Creators</h3>
                <p className="text-muted text-xs">By project count</p>
              </div>
              <Trophy className="h-5 w-5 text-highlight" />
            </div>
            <div className="space-y-3">
              {topCreators.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No activity yet</p>
              )}
              {topCreators.map((creator: any, idx: number) => (
                <div
                  key={creator.id}
                  className="flex items-center gap-3 p-3 bg-surface-high rounded-lg border border-border hover:border-primary/40 transition-all"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                    idx === 2 ? 'bg-orange-600/20 text-orange-500' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {idx < 3 ? <Award className="h-4 w-4" /> : `#${idx + 1}`}
                  </div>
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {creator.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{creator.name}</p>
                    <p className="text-xs text-muted truncate">{creator.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent">{creator.count}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted">projects</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Advanced Analytics Row 2: Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-surface border border-border rounded-lg bloom-shadow p-8 mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-headline font-bold text-foreground uppercase tracking-tight mb-1">Activity Heatmap</h3>
              <p className="text-muted text-sm">Conversions by day & hour (last {activityRangeDays} days)</p>
            </div>
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              {/* Hour labels */}
              <div className="flex gap-1 mb-2 ml-12">
                {Array.from({ length: 24 }).map((_, h) => (
                  <div
                    key={h}
                    className="flex-1 text-center text-[9px] text-muted font-label"
                    style={{ minWidth: 22 }}
                  >
                    {h % 3 === 0 ? `${h}h` : ''}
                  </div>
                ))}
              </div>
              {daysOrder.map((day) => (
                <div key={day} className="flex items-center gap-1 mb-1">
                  <div className="w-10 text-xs text-muted font-label uppercase">{day}</div>
                  {Array.from({ length: 24 }).map((_, h) => {
                    const cell = heatmapData.find((d: any) => d.day === day && d.hour === h);
                    const v = cell?.value || 0;
                    return (
                      <div
                        key={h}
                        title={`${day} ${h}:00 — ${v} conversion${v === 1 ? '' : 's'}`}
                        className={`flex-1 h-6 rounded border transition-all hover:scale-110 cursor-pointer ${heatCellColor(v)}`}
                        style={{ minWidth: 22 }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted">
            <span>Less</span>
            <div className="w-4 h-4 rounded bg-surface-high border border-border" />
            <div className="w-4 h-4 rounded bg-primary/20 border border-primary/20" />
            <div className="w-4 h-4 rounded bg-primary/40 border border-primary/30" />
            <div className="w-4 h-4 rounded bg-primary/70 border border-primary/40" />
            <div className="w-4 h-4 rounded bg-primary border border-primary/50" />
            <span>More</span>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-surface border border-border rounded-lg bloom-shadow">
            <div className="border-b border-border p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">User Management</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10 border-border bg-surface-high text-foreground placeholder:text-muted/50 w-64 focus:ring-2 focus:ring-blue-500 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted font-medium">User</TableHead>
                      <TableHead className="text-muted font-medium">Email</TableHead>
                      <TableHead className="text-muted font-medium">Role</TableHead>
                      <TableHead className="text-muted font-medium">Status</TableHead>
                      <TableHead className="text-muted font-medium">Projects</TableHead>
                      <TableHead className="text-muted font-medium">Joined</TableHead>
                      <TableHead className="text-muted font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-border hover:bg-surface-high transition-colors">
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="border-2 border-primary/30">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground font-medium">
                            {user.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-primary/10 text-primary border-primary/20 capitalize font-medium">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.status === 'active'
                                ? 'bg-success/10 text-success border-success/20 font-medium'
                                : 'bg-muted/10 text-muted border-muted/20 font-medium'
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          {user.projects}
                        </TableCell>
                        <TableCell className="text-muted">
                          {user.joinedAt}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-surface-high rounded-lg text-muted hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-surface border-border">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(user)}
                                className="hover:bg-surface-high text-muted hover:text-foreground"
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditUser(user)}
                                className="hover:bg-surface-high text-muted hover:text-foreground"
                              >
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(user.id, user.status)}
                                className="hover:bg-surface-high text-muted hover:text-foreground"
                              >
                                {user.status === 'active'
                                  ? 'Deactivate'
                                  : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user)}
                                className="text-destructive hover:bg-destructive/20"
                              >
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-surface border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription className="text-muted">
              Create a new user account. Fill in all the required fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter user name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border">
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="border-border text-muted hover:bg-surface-high"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAddUser}
              className="bg-primary hover:brightness-110"
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-surface border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-muted">
              Update user information. Make changes to the fields below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter user name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border">
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-border text-muted hover:bg-surface-high"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEditUser}
              className="bg-primary hover:brightness-110"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-surface border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="text-muted">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && (
              <div className="p-4 bg-surface-high rounded-lg border border-border">
                <p className="text-sm text-muted">User to be deleted:</p>
                <p className="text-lg font-semibold text-foreground mt-1">{selectedUser.name}</p>
                <p className="text-sm text-muted">{selectedUser.email}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-border text-muted hover:bg-surface-high"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteUser}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-surface border-border text-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription className="text-muted">
              Complete information about this user
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && (
              <div className="space-y-6">
                {/* User Avatar and Basic Info */}
                <div className="flex items-center gap-4 p-4 bg-surface-high rounded-lg border border-border">
                  <Avatar className="w-16 h-16 border-2 border-primary/30">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                      {selectedUser.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{selectedUser.name}</h3>
                    <p className="text-muted">{selectedUser.email}</p>
                  </div>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-high rounded-lg border border-border">
                    <p className="text-sm text-muted mb-1">User ID</p>
                    <p className="text-foreground font-medium">{selectedUser.id}</p>
                  </div>
                  <div className="p-4 bg-surface-high rounded-lg border border-border">
                    <p className="text-sm text-muted mb-1">Role</p>
                    <Badge className="bg-primary/10 text-primary border-primary/20 capitalize font-medium">
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div className="p-4 bg-surface-high rounded-lg border border-border">
                    <p className="text-sm text-muted mb-1">Status</p>
                    <Badge
                      className={
                        selectedUser.status === 'active'
                          ? 'bg-success/10 text-success border-success/20 font-medium'
                          : 'bg-muted/10 text-muted border-muted/20 font-medium'
                      }
                    >
                      {selectedUser.status}
                    </Badge>
                  </div>
                  <div className="p-4 bg-surface-high rounded-lg border border-border">
                    <p className="text-sm text-muted mb-1">Joined Date</p>
                    <p className="text-foreground font-medium">{selectedUser.joinedAt}</p>
                  </div>
                </div>

                {/* Statistics */}
                <div className="p-4 bg-surface-high rounded-lg border border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Activity Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted">Projects</p>
                      <p className="text-2xl font-bold text-foreground">{selectedUser.projects}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted">Total Conversions</p>
                      <p className="text-2xl font-bold text-foreground">{selectedUser.projects * 2 || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted">Last Active</p>
                      <p className="text-sm font-medium text-foreground">Today</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
              className="border-border text-muted hover:bg-surface-high"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
