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
      iconColor: 'text-blue-600',
      bgColor: 'from-blue-50 to-purple-50',
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: UserCheck,
      iconColor: 'text-blue-600',
      bgColor: 'from-blue-50 to-purple-50',
      change: '+8%',
      changeType: 'positive',
    },
    {
      title: 'Total Projects',
      value: stats.totalProjects.toLocaleString(),
      icon: Video,
      iconColor: 'text-blue-600',
      bgColor: 'from-blue-50 to-purple-50',
      change: '+23%',
      changeType: 'positive',
    },
    {
      title: 'System Health',
      value: `${stats.systemHealth}%`,
      icon: Activity,
      iconColor: 'text-blue-600',
      bgColor: 'from-blue-50 to-purple-50',
      change: '+2%',
      changeType: 'positive',
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
          className="mb-12 flex items-start justify-between"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-xl text-gray-600">
              Welcome back, {user?.name}! Here's what's happening today.
            </p>
          </div>
          <Button
            onClick={handleLogout}
            className="gradient-button text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <span className="hidden sm:inline">{user?.name}</span>
            <LogOut className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </Button>
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
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 h-full">
                  {/* Icon with subtle background */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-7 w-7 ${stat.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-end justify-between">
                      <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
                      <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </div>
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="border-b border-gray-100 p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10 border-gray-200 bg-white text-gray-900 w-64 focus:ring-2 focus:ring-blue-500 rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button className="gradient-button text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    Add User
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableHead className="text-gray-600 font-medium">User</TableHead>
                      <TableHead className="text-gray-600 font-medium">Email</TableHead>
                      <TableHead className="text-gray-600 font-medium">Role</TableHead>
                      <TableHead className="text-gray-600 font-medium">Status</TableHead>
                      <TableHead className="text-gray-600 font-medium">Projects</TableHead>
                      <TableHead className="text-gray-600 font-medium">Joined</TableHead>
                      <TableHead className="text-gray-600 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-gray-100 hover:bg-gray-50 transition-colors">
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="border-2 border-blue-100">
                            <AvatarFallback className="bg-gradient-to-br from-blue-50 to-purple-50 text-blue-600 font-semibold">
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
                          <Badge className="bg-blue-50 text-blue-600 border-0 capitalize font-medium">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.status === 'active'
                                ? 'bg-green-50 text-green-600 border-0 font-medium'
                                : 'bg-gray-100 text-gray-600 border-0 font-medium'
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
                              <Button variant="ghost" size="sm" className="hover:bg-gray-100 rounded-lg">
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-gray-200">
                              <DropdownMenuItem className="hover:bg-gray-50">View Details</DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-gray-50">Edit User</DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-gray-50">
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
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
