'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Video,
  TrendingUp,
  Activity,
  UserX,
  UserCheck,
  MoreVertical,
  Search,
  LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, token } = useAuthStore();
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

  // Check authentication and admin role
  useEffect(() => {
    const checkAuth = () => {
      if (!token || !user) {
        router.push('/login');
        return;
      }

      if (user.role !== 'admin') {
        router.push('/creator');
        return;
      }

      setIsAuthChecking(false);
    };

    checkAuth();
  }, [token, user, router]);

  useEffect(() => {
    if (!isAuthChecking && user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [isAuthChecking, user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats from backend
      const statsResponse = await adminAPI.getSystemStats();
      setStats({
        totalUsers: statsResponse.data.data.totalUsers,
        activeUsers: statsResponse.data.data.activeUsers,
        totalProjects: statsResponse.data.data.totalProjects,
        systemHealth: statsResponse.data.data.systemHealth,
      });

      // Fetch users from backend
      const usersResponse = await adminAPI.getUsers();
      setUsers(usersResponse.data.data.users || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Show error notification but keep loading state
    } finally {
      setIsLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'from-purple-400 to-pink-400',
      change: '+12%',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: UserCheck,
      color: 'from-green-400 to-emerald-400',
      change: '+8%',
    },
    {
      title: 'Total Projects',
      value: stats.totalProjects.toLocaleString(),
      icon: Video,
      color: 'from-blue-400 to-cyan-400',
      change: '+23%',
    },
    {
      title: 'System Health',
      value: `${stats.systemHealth}%`,
      icon: Activity,
      color: 'from-yellow-400 to-orange-400',
      change: '+2%',
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading state while checking authentication
  if (isAuthChecking || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-blue-50/30 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between"
        >
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-2">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Admin Dashboard
              </span>
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back, {user?.name}! Here's what's happening today.
            </p>
          </div>
          <Button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <span className="hidden sm:inline">{user?.name}</span>
            <LogOut className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="bg-white border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm">
                        {stat.change}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm font-medium mb-1">{stat.title}</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white border-gray-200 shadow-xl">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">User Management</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10 border-gray-300 bg-white text-gray-900 w-64 focus:ring-2 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg">Add User</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50/50">
                      <TableHead className="text-gray-700 font-semibold">User</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Email</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Role</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Projects</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Joined</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-gray-200 hover:bg-blue-50/50 transition-colors">
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="border-2 border-blue-200">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-gray-900 font-medium">
                            {user.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 capitalize shadow-sm">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.status === 'active'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm'
                                : 'bg-gray-300 text-gray-600 border-0'
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-900 font-medium">
                          {user.projects}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {user.joinedAt}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-blue-100">
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-gray-200">
                              <DropdownMenuItem className="hover:bg-blue-50">View Details</DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-blue-50">Edit User</DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-blue-50">
                                {user.status === 'active'
                                  ? 'Deactivate'
                                  : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 hover:bg-red-50">
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
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
