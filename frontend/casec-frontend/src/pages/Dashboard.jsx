import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Award, TrendingUp, Search, UserCheck, Settings, MapPin, ChevronRight, ImageIcon } from 'lucide-react';
import { usersAPI, eventsAPI, getAssetUrl } from '../services/api';
import { useAuthStore } from '../store/useStore';
import { useTheme } from '../components/ThemeProvider';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { theme } = useTheme();
  const appName = theme?.organizationName || 'Community';
  const [dashboardData, setDashboardData] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    loadRecentEvents();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await usersAPI.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentEvents = async () => {
    try {
      const response = await eventsAPI.getAll({ upcoming: true });
      if (response.success) {
        // Show only first 4 upcoming events
        setRecentEvents((response.data || []).slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('default', { month: 'short' }),
      time: date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
          Welcome Back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Here's what's happening in your {appName} community
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-primary to-primary-light text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-semibold mb-2">Your Membership</p>
              <h3 className="text-2xl font-bold mb-1">{dashboardData?.user?.membershipTypeName}</h3>
              <p className="text-white/80 text-sm">Active until Dec 2025</p>
            </div>
            <Award className="w-12 h-12 text-white/30" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold mb-2">Your Clubs</p>
              <h3 className="text-4xl font-bold text-primary mb-1">
                {dashboardData?.clubCount || 0}
              </h3>
              <p className="text-gray-500 text-sm">clubs joined</p>
            </div>
            <Users className="w-12 h-12 text-primary/20" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold mb-2">Upcoming Events</p>
              <h3 className="text-4xl font-bold text-accent mb-1">
                {dashboardData?.eventCount || 0}
              </h3>
              <p className="text-gray-500 text-sm">events registered</p>
            </div>
            <Calendar className="w-12 h-12 text-accent/20" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center space-x-3 mb-3">
            <Users className="w-6 h-6 text-accent" />
            <h3 className="text-xl font-bold text-gray-900">Explore Clubs</h3>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Join clubs that match your interests and connect with like-minded members.
          </p>
          <a href="/clubs" className="btn btn-accent inline-block text-sm">
            Browse Clubs
          </a>
        </div>

        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center space-x-3 mb-3">
            <Calendar className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-gray-900">Events</h3>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Register for community events and activities happening soon.
          </p>
          <a href="/events" className="btn btn-primary inline-block text-sm">
            View Events
          </a>
        </div>

        <div className="card bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center space-x-3 mb-3">
            <Search className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Members</h3>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Search and connect with fellow {appName} community members.
          </p>
          <a href="/members" className="btn bg-blue-600 text-white hover:bg-blue-700 inline-block text-sm">
            Find Members
          </a>
        </div>

        <div className="card bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-center space-x-3 mb-3">
            <UserCheck className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">Directors</h3>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Meet the board of directors leading our organization.
          </p>
          <a href="/board-of-directors" className="btn bg-purple-600 text-white hover:bg-purple-700 inline-block text-sm">
            View Board
          </a>
        </div>

        {/* Admin Panel Card - Only visible to admins */}
        {user?.isAdmin && (
          <div className="card bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <div className="flex items-center space-x-3 mb-3">
              <Settings className="w-6 h-6 text-amber-600" />
              <h3 className="text-xl font-bold text-gray-900">Admin Panel</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Manage users, payments, events, and customize the site.
            </p>
            <Link to="/admin" className="btn bg-amber-600 text-white hover:bg-amber-700 inline-block text-sm">
              Open Admin
            </Link>
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-display font-bold text-gray-900">Upcoming Events</h2>
          </div>
          <Link to="/events" className="text-primary hover:text-primary-light font-medium flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentEvents.map((event) => {
              const dateInfo = formatEventDate(event.eventDate);
              return (
                <Link
                  key={event.eventId}
                  to={`/events/${event.eventId}`}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                    {event.thumbnailUrl ? (
                      <img
                        src={getAssetUrl(event.thumbnailUrl)}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: `${event.thumbnailFocusX ?? 50}% ${event.thumbnailFocusY ?? 50}%` }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary truncate">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <span className="font-medium text-accent">{dateInfo.month} {dateInfo.day}</span>
                      <span className="text-gray-400">at</span>
                      <span>{dateInfo.time}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {event.isUserRegistered && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Registered
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No upcoming events at the moment.</p>
            <Link to="/events" className="text-primary hover:underline text-sm mt-2 inline-block">
              Browse all events
            </Link>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-display font-bold text-gray-900">Recent Activity</h2>
        </div>

        {dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 ? (
          <div className="space-y-4">
            {dashboardData.recentActivities.map((activity) => (
              <div
                key={activity.logId}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{activity.activityType}</p>
                  <p className="text-gray-600 text-sm">{activity.description}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No recent activity. Start by joining clubs or registering for events!</p>
          </div>
        )}
      </div>
    </div>
  );
}
