import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Users, CreditCard, Building2, Calendar, Tag, Palette,
  BarChart3, FileText, ClipboardList, Image, ChevronLeft,
  Settings, Home, LayoutDashboard, Ticket, Music, LayoutGrid, Shield
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import LogoOrText from './LogoOrText';

export default function AdminLayout() {
  const { user, canAccessArea } = useAuthStore();
  const navigate = useNavigate();

  // Links with areaKey for permission checking
  const allAdminLinks = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, areaKey: 'dashboard' },
    { type: 'divider', label: 'Users & Membership', category: 'users' },
    { path: '/admin/users', label: 'Manage Users', icon: Users, areaKey: 'users' },
    { path: '/admin/membership-types', label: 'Membership Types', icon: Tag, areaKey: 'membership-types' },
    { path: '/admin/payments', label: 'Payments', icon: CreditCard, areaKey: 'payments' },
    { path: '/admin/payment-methods', label: 'Payment Methods', icon: CreditCard, areaKey: 'payment-methods' },
    { type: 'divider', label: 'Content', category: 'content' },
    { path: '/admin/clubs', label: 'Manage Clubs', icon: Building2, areaKey: 'clubs' },
    { path: '/admin/events', label: 'Manage Events', icon: Calendar, areaKey: 'events' },
    { path: '/admin/event-types', label: 'Event Types', icon: Tag, areaKey: 'event-types' },
    { path: '/admin/programs', label: 'Event Programs', icon: Music, areaKey: 'programs' },
    { path: '/admin/performers', label: 'Performers', icon: Users, areaKey: 'performers' },
    { path: '/admin/content-cards', label: 'Content Cards', icon: LayoutGrid, areaKey: 'content-cards' },
    { type: 'divider', label: 'Engagement', category: 'engagement' },
    { path: '/admin/polls', label: 'Polls', icon: BarChart3, areaKey: 'polls' },
    { path: '/admin/surveys', label: 'Surveys', icon: ClipboardList, areaKey: 'surveys' },
    { path: '/admin/raffles', label: 'Raffles', icon: Ticket, areaKey: 'raffles' },
    { path: '/admin/seat-raffles', label: 'Seat Raffles', icon: Ticket, areaKey: 'raffles' },
    { type: 'divider', label: 'Appearance', category: 'appearance' },
    { path: '/admin/slideshows', label: 'SlideShows', icon: Image, areaKey: 'slideshows' },
    { path: '/admin/theme', label: 'Theme Settings', icon: Palette, areaKey: 'theme' },
    { type: 'divider', label: 'System', category: 'system' },
    { path: '/admin/assets', label: 'Asset Manager', icon: Image, areaKey: 'assets' },
    { path: '/admin/asset-file-types', label: 'File Types', icon: FileText, areaKey: 'assets' },
    { path: '/admin/roles', label: 'Role Management', icon: Shield, areaKey: 'roles' },
  ];

  // Filter links based on user permissions
  const adminLinks = allAdminLinks.filter((link, index, arr) => {
    // For dividers, check if there are any visible links in this category
    if (link.type === 'divider') {
      // Find the next divider or end of array
      const nextDividerIndex = arr.findIndex((l, i) => i > index && l.type === 'divider');
      const endIndex = nextDividerIndex === -1 ? arr.length : nextDividerIndex;
      // Check if any link between this divider and the next is accessible
      const hasVisibleLinks = arr.slice(index + 1, endIndex).some(l => l.areaKey && canAccessArea(l.areaKey));
      return hasVisibleLinks;
    }
    // For regular links, check if user can access this area
    return canAccessArea(link.areaKey);
  });

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg text-gray-900">Admin Panel</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {adminLinks.map((link, index) => {
              if (link.type === 'divider') {
                return (
                  <li key={index} className="pt-4 pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {link.label}
                    </span>
                  </li>
                );
              }

              const Icon = link.icon;
              return (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end={link.end}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back to Site */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors w-full"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Site</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <LogoOrText />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                Logged in as <span className="font-semibold">{user?.firstName} {user?.lastName}</span>
              </span>
              <span className={`px-2 py-1 text-white text-xs font-bold rounded ${user?.isAdmin ? 'bg-accent' : 'bg-indigo-600'}`}>
                {user?.isAdmin ? 'Admin' : 'Staff'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
