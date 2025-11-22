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
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    systemHealth: 100,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data - replace with actual API calls
      setStats({
        totalUsers: 1250,
        activeUsers: 892,
        totalProjects: 5430,
        systemHealth: 98,
      });

      setUsers([
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'creator',
          status: 'active',
          projects: 12,
          joinedAt: '2024-01-15',
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'creator',
          status: 'active',
          projects: 8,
          joinedAt: '2024-02-20',
        },
        {
          id: '3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'creator',
          status: 'inactive',
          projects: 3,
          joinedAt: '2024-03-10',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
    router.push('/admin-login');
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-mesh opacity-20"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Admin Dashboard
              </span>
            </h1>
            <p className="text-gray-400">
              Welcome back, {user?.name}! Here's what's happening today.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2 border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
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
              <Card key={index} className="glass-strong border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-0">
                      {stat.change}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-strong border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">User Management</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10 glass border-white/10 text-white w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button className="gradient-primary">Add User</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-400">User</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Role</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Projects</TableHead>
                      <TableHead className="text-gray-400">Joined</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-white/10">
                        <TableCell className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400">
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white font-medium">
                            {user.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-purple-500/20 text-purple-400 border-0 capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.status === 'active'
                                ? 'bg-green-500/20 text-green-400 border-0'
                                : 'bg-gray-500/20 text-gray-400 border-0'
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">
                          {user.projects}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {user.joinedAt}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit User</DropdownMenuItem>
                              <DropdownMenuItem>
                                {user.status === 'active'
                                  ? 'Deactivate'
                                  : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400">
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
