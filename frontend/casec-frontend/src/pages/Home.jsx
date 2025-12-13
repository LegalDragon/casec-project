import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { eventsAPI, getAssetUrl } from '../services/api';
import { useTheme } from '../components/ThemeProvider';

export default function Home() {
  const { theme } = useTheme();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastFeaturedEvents, setPastFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Fetch upcoming events
      const upcomingResponse = await eventsAPI.getAll({ upcoming: true });
      const upcoming = (upcomingResponse.data || []).slice(0, 10);
      setUpcomingEvents(upcoming);

      // Fetch all events to filter past featured ones
      const allResponse = await eventsAPI.getAll({ upcoming: false });
      const now = new Date();
      const pastFeatured = (allResponse.data || [])
        .filter(e => e.isFeatured && new Date(e.eventDate) < now)
        .slice(0, 10);
      setPastFeaturedEvents(pastFeatured);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const EventCard = ({ event, isPast = false }) => (
    <Link
      to={`/event/${event.eventId}`}
      className={`block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02] ${isPast ? 'opacity-90' : ''}`}
    >
      {/* Thumbnail */}
      <div className="h-32 relative bg-gradient-to-br from-primary/20 to-accent/20">
        {event.thumbnailUrl ? (
          <img
            src={event.thumbnailUrl.startsWith('/api') ? getAssetUrl(event.thumbnailUrl) : event.thumbnailUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-primary/30" />
          </div>
        )}
        {event.isFeatured && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
            Featured
          </span>
        )}
        {isPast && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="px-2 py-1 bg-gray-800/80 text-white text-xs rounded">Past Event</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
          {event.title}
        </h4>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{formatDate(event.eventDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{formatTime(event.eventDate)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-accent flex flex-col">
      {/* Hero Section - Logo, Name, and CTAs Centered */}
      <section className="px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Large Logo with Name */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="flex items-center justify-center gap-4">
              {theme?.logoUrl ? (
                <img
                  src={getAssetUrl(theme.logoUrl)}
                  alt={theme.organizationName || 'Logo'}
                  className="h-32 md:h-48 w-auto object-contain"
                />
              ) : null}
              <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white">
                {theme?.organizationName || 'CASEC'}<span className="text-accent-light">.</span>
              </h1>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Link
              to="/login"
              className="px-8 py-3 text-white font-semibold text-lg border-2 border-white/50 rounded-xl hover:bg-white/10 transition-all"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-primary font-bold text-lg rounded-xl hover:bg-accent hover:text-white transition-all shadow-xl"
            >
              Join Us
            </Link>
          </div>

          {/* Inspirational Quote Block */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-white/20">
            <blockquote className="text-2xl md:text-3xl font-display font-bold text-white leading-relaxed mb-4">
              "Building bridges across cultures, creating connections that last a lifetime."
            </blockquote>
            <p className="text-white/80 text-lg">
              Join our vibrant community celebrating heritage, fostering friendships, and making memories together.
            </p>
          </div>
        </div>
      </section>

      {/* Events Section - Two Columns */}
      <section className="px-6 py-12 bg-black/20 backdrop-blur-sm flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Upcoming Events */}
            <div>
              <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Upcoming Events
              </h3>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/20 rounded-xl h-48 animate-pulse" />
                  ))}
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.eventId} event={event} />
                  ))}
                </div>
              ) : (
                <div className="bg-white/10 rounded-xl p-8 text-center">
                  <Calendar className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/70">No upcoming events scheduled</p>
                </div>
              )}
            </div>

            {/* Right Column - Past Featured Events */}
            <div>
              <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Past Featured Events
              </h3>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/20 rounded-xl h-48 animate-pulse" />
                  ))}
                </div>
              ) : pastFeaturedEvents.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {pastFeaturedEvents.map((event) => (
                    <EventCard key={event.eventId} event={event} isPast />
                  ))}
                </div>
              ) : (
                <div className="bg-white/10 rounded-xl p-8 text-center">
                  <Clock className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/70">No past featured events</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 bg-black/30">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} {theme?.organizationName || 'CASEC'}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
