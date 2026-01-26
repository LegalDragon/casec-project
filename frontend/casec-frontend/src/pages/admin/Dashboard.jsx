import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CreditCard, Building2, Calendar, Tag, Palette,
  BarChart3, FileText, ClipboardList, Image, TrendingUp,
  UserCheck, DollarSign, Activity, ExternalLink, Home
} from 'lucide-react';
import { usersAPI, membershipPaymentsAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load multiple data sources
      const [usersRes, paymentsRes] = await Promise.all([
        usersAPI.getAll().catch(() => ({ success: false })),
        membershipPaymentsAPI.getAll().catch(() => ({ success: false }))
      ]);

      // Calculate stats
      const users = usersRes.success ? usersRes.data : [];
      const payments = paymentsRes.success ? paymentsRes.data : [];

      setStats({
        totalUsers: users.length,
        activeMembers: users.filter(u => u.membershipStatus === 'Active').length,
        pendingPayments: payments.filter(p => p.status === 'Pending').length,
        totalRevenue: payments
          .filter(p => p.status === 'Approved')
          .reduce((sum, p) => sum + (p.amount || 0), 0)
      });

      // Get recent pending payments
      setRecentPayments(
        payments
          .filter(p => p.status === 'Pending')
          .slice(0, 5)
      );
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { path: '/admin/users', label: 'Manage Users', icon: Users, color: 'bg-blue-500', description: 'View and manage user accounts' },
    { path: '/admin/payments', label: 'Payments', icon: CreditCard, color: 'bg-green-500', description: 'Review payment submissions' },
    { path: '/admin/clubs', label: 'Manage Clubs', icon: Building2, color: 'bg-purple-500', description: 'Organize community clubs' },
    { path: '/admin/events', label: 'Manage Events', icon: Calendar, color: 'bg-orange-500', description: 'Create and manage events' },
    { path: '/admin/polls', label: 'Polls', icon: BarChart3, color: 'bg-pink-500', description: 'Create polls and surveys' },
    { path: '/admin/theme', label: 'Theme Settings', icon: Palette, color: 'bg-indigo-500', description: 'Customize appearance' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your community management</p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Home className="w-4 h-4" />
          View Public Home
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.activeMembers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.pendingPayments || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${(stats?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 ${link.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {link.label}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{link.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Pending Payments */}
      {recentPayments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Pending Payments</h2>
              <Link
                to="/admin/payments"
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentPayments.map((payment) => (
              <div key={payment.paymentId} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {payment.user?.firstName} {payment.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {payment.membershipType?.name} - ${payment.amount}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  Pending Review
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
