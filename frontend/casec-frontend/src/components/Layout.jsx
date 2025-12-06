import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { useState } from 'react';
import LogoOrText from './LogoOrText';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/clubs', label: 'Clubs' },
    { path: '/events', label: 'Events' },
    { path: '/members', label: 'Members' },
    { path: '/board-of-directors', label: 'Directors' },
    { path: '/profile', label: 'Profile' },
  ];

  const adminLinks = user?.isAdmin ? [
    { path: '/admin/users', label: 'Manage Users' },
    { path: '/admin/membership-types', label: 'Membership Types' },
    { path: '/admin/clubs', label: 'Manage Clubs' },
    { path: '/admin/events', label: 'Manage Events' },
    { path: '/admin/theme', label: 'Theme Customization' },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-primary shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <LogoOrText />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex flex-col items-end space-y-2">
              {/* Main Navigation */}
              <div className="flex space-x-8">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `font-semibold transition-colors relative group ${
                        isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'
                      }`
                    }
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full" />
                  </NavLink>
                ))}
              </div>
              
              {/* Admin Navigation - New Line */}
              {adminLinks.length > 0 && (
                <div className="flex space-x-6 pt-2 border-t border-gray-200">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">Admin:</span>
                  {adminLinks.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      className={({ isActive }) =>
                        `text-sm font-semibold transition-colors relative group ${
                          isActive ? 'text-accent' : 'text-gray-600 hover:text-accent'
                        }`
                      }
                    >
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full" />
                    </NavLink>
                  ))}
                </div>
              )}
            </nav>

            {/* User Info & Logout */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-sm">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-gray-500">{user?.membershipTypeName}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary flex items-center space-x-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg font-semibold ${
                        isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                
                {adminLinks.length > 0 && (
                  <>
                    <div className="border-t my-2" />
                    <div className="px-4 py-1 text-xs font-bold text-accent uppercase tracking-wider">
                      Admin Menu
                    </div>
                    {adminLinks.map((link) => (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `px-4 py-2 rounded-lg font-semibold ${
                            isActive ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-100'
                          }`
                        }
                      >
                        {link.label}
                      </NavLink>
                    ))}
                  </>
                )}
                
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary flex items-center justify-center space-x-2 mt-4"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
