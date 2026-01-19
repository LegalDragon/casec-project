import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Users, ExternalLink, Sparkles, Megaphone, Handshake, Building2, ImageIcon } from 'lucide-react';
import { eventsAPI, clubsAPI, eventTypesAPI, getAssetUrl } from '../services/api';
import { useTheme } from '../components/ThemeProvider';

export default function EnhancedEvents() {
  const { theme } = useTheme();
  const appName = theme?.organizationName || 'Community';
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedClub, setSelectedClub] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);

  useEffect(() => {
    loadEvents();
    loadCategories();
    loadClubs();
    loadEventTypes();
  }, []);

  const loadEventTypes = async () => {
    try {
      const response = await eventTypesAPI.getAll();
      if (response.success && response.data) {
        setEventTypes(response.data);
      }
    } catch (err) {
      console.error('Failed to load event types:', err);
    }
  };

  useEffect(() => {
    filterEvents();
  }, [selectedType, selectedCategory, selectedClub, dateFrom, dateTo, events]);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      if (response.success) {
        setEvents(response.data);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await eventsAPI.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadClubs = async () => {
    try {
      const response = await clubsAPI.getAll();
      if (response.success) {
        setClubs(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load clubs:', err);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    if (selectedType !== 'all') {
      filtered = filtered.filter(e => e.eventType === selectedType);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.eventCategory === selectedCategory);
    }

    if (selectedClub !== 'all') {
      if (selectedClub === 'casec') {
        filtered = filtered.filter(e => !e.hostClubId);
      } else {
        filtered = filtered.filter(e => e.hostClubId && e.hostClubId.toString() === selectedClub);
      }
    }

    if (dateFrom) {
      filtered = filtered.filter(e => new Date(e.eventDate) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter(e => new Date(e.eventDate) <= new Date(dateTo + 'T23:59:59'));
    }

    setFilteredEvents(filtered);
  };

  const handleRegister = async (eventId, eventType, registrationUrl) => {
    // If it's a partner event with external registration
    if (eventType === 'PartnerEvent' && registrationUrl) {
      window.open(registrationUrl, '_blank');
      return;
    }

    // If it's an announcement, just show info
    if (eventType === 'Announcement') {
      alert('This is an announcement. No registration required.');
      return;
    }

    // Regular CASEC event registration
    try {
      const response = await eventsAPI.register(eventId, { numberOfGuests: 0 });
      if (response.success) {
        alert('Successfully registered!');
        loadEvents();
      }
    } catch (err) {
      alert('Registration failed: ' + (err.message || 'Please try again'));
    }
  };

  const getEventTypeInfo = (type) => {
    // Find the event type from API data
    const foundType = eventTypes.find(et => et.code === type);
    if (foundType) {
      // Map API color to Tailwind classes
      const colorMap = {
        'primary': { color: 'bg-primary', textColor: 'text-primary' },
        'accent': { color: 'bg-accent', textColor: 'text-accent' },
        'info': { color: 'bg-blue-600', textColor: 'text-blue-600' },
        'success': { color: 'bg-green-600', textColor: 'text-green-600' },
        'warning': { color: 'bg-amber-600', textColor: 'text-amber-600' },
        'error': { color: 'bg-red-600', textColor: 'text-red-600' },
        'gray': { color: 'bg-gray-600', textColor: 'text-gray-600' },
      };
      const colors = colorMap[foundType.color] || colorMap['primary'];
      return {
        icon: foundType.icon || 'Calendar',
        label: foundType.displayName,
        ...colors
      };
    }
    // Fallback defaults
    const defaults = {
      'CasecEvent': { icon: 'Calendar', color: 'bg-primary', textColor: 'text-primary', label: 'Community Event' },
      'PartnerEvent': { icon: 'Handshake', color: 'bg-accent', textColor: 'text-accent', label: 'Partner Event' },
      'Announcement': { icon: 'Megaphone', color: 'bg-amber-600', textColor: 'text-amber-600', label: 'Announcement' }
    };
    return defaults[type] || defaults['CasecEvent'];
  };

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedClub('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = selectedType !== 'all' || selectedCategory !== 'all' || selectedClub !== 'all' || dateFrom || dateTo;

  if (loading) return <div className="text-center py-12">Loading events...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Community Events</h1>
        <p className="text-gray-600 text-lg">Discover {appName} events, partner opportunities, and community announcements</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Event Type Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Types</option>
              <option value="CasecEvent">🎉 {appName} Events</option>
              <option value="ClubEvent">👥 Club Events</option>
              <option value="PartnerEvent">🤝 Partner Events</option>
              <option value="Announcement">📢 Announcements</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Club Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hosting Club</label>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Clubs</option>
              <option value="casec">{appName} Organization</option>
              {clubs.map(club => (
                <option key={club.clubId} value={club.clubId}>{club.name}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input w-full text-sm"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input w-full text-sm"
                placeholder="To"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedType !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {getEventTypeInfo(selectedType).label}
                <button onClick={() => setSelectedType('all')} className="ml-2">×</button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="ml-2">×</button>
              </span>
            )}
            {selectedClub !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {selectedClub === 'casec' ? appName : clubs.find(c => c.clubId.toString() === selectedClub)?.name}
                <button onClick={() => setSelectedClub('all')} className="ml-2">×</button>
              </span>
            )}
            {(dateFrom || dateTo) && (
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {dateFrom || 'Any'} - {dateTo || 'Any'}
                <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="ml-2">×</button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {filteredEvents.map((event) => {
          const eventDate = new Date(event.eventDate);
          const typeInfo = getEventTypeInfo(event.eventType);

          return (
            <div
              key={event.eventId}
              className={`rounded-xl ${event.isFeatured ? 'ring-4 ring-accent shadow-2xl' : 'shadow-lg'} overflow-hidden relative bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600`}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail - full width on mobile, fixed width on desktop */}
                <div className="flex-shrink-0 w-full sm:w-40 md:w-48">
                  <Link to={`/events/${event.eventId}`} className="block">
                    {event.thumbnailUrl ? (
                      <img
                        src={getAssetUrl(event.thumbnailUrl)}
                        alt={event.title}
                        className="w-full h-48 sm:h-full sm:min-h-[280px] object-cover hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-48 sm:h-full sm:min-h-[280px] bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                  </Link>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col">
                  {/* Featured Badge */}
                  {event.isFeatured && (
                    <div className="absolute top-3 right-3 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Featured</span>
                    </div>
                  )}

                  {/* Title */}
                  <Link
                    to={`/events/${event.eventId}`}
                    className="text-lg sm:text-xl font-display font-bold text-white hover:text-accent transition-colors leading-tight block mb-2"
                    title="Click to view event details"
                  >
                    {event.title}
                  </Link>

                  {/* Event Type Badge and Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${typeInfo.color} text-white`}>
                      <span>{typeInfo.icon}</span>
                      <span>{typeInfo.label}</span>
                    </div>
                    <div className="text-center bg-white/20 rounded-lg px-2 py-1 flex-shrink-0">
                      <div className="text-lg font-bold leading-none text-white">{eventDate.getDate()}</div>
                      <div className="text-xs text-white/80">{eventDate.toLocaleDateString('default', { month: 'short' })}</div>
                    </div>
                  </div>

                  {/* Category and Club badges */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {event.eventCategory && (
                      <span className="inline-block px-2 py-1 bg-white/20 text-white rounded text-xs font-semibold">
                        {event.eventCategory}
                      </span>
                    )}
                    {event.hostClubName && (
                      <span className="inline-flex items-center px-2 py-1 bg-white/20 text-white rounded text-xs font-semibold">
                        <Building2 className="w-3 h-3 mr-1" />
                        {event.hostClubName}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-white/80 text-sm mb-3 line-clamp-2 flex-grow">{event.description}</p>

                  {/* Partner Info */}
                  {event.partnerName && (
                    <div className="bg-white/10 rounded-lg p-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <Handshake className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Hosted by {event.partnerName}</span>
                      </div>
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="space-y-1 text-sm text-white/80 mb-3">
                    {event.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-white" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-white" />
                      <span>{eventDate.toLocaleString()}</span>
                    </div>
                    {event.isRegistrationRequired && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-white" />
                        <span>{event.spotsRemaining} spots remaining</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/20 mt-auto">
                    {event.eventType !== 'Announcement' && (
                      <div className="text-lg sm:text-xl font-bold text-accent flex items-center">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                        {event.eventFee}
                      </div>
                    )}

                    {/* Different buttons based on event type */}
                    {event.eventType === 'Announcement' ? (
                      <div className="flex items-center space-x-2 text-amber-400">
                        <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-semibold text-xs sm:text-sm">Information Only</span>
                      </div>
                    ) : event.eventType === 'PartnerEvent' && event.registrationUrl ? (
                      <button
                        onClick={() => handleRegister(event.eventId, event.eventType, event.registrationUrl)}
                        className="btn bg-blue-500 text-white hover:bg-blue-600 flex items-center space-x-2 text-xs sm:text-sm py-2"
                      >
                        <span>Partner Site</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    ) : event.isRegistrationRequired ? (
                      <button
                        onClick={() => handleRegister(event.eventId, event.eventType)}
                        disabled={event.isUserRegistered || event.spotsRemaining === 0}
                        className={`btn text-xs sm:text-sm py-2 ${event.isUserRegistered ? 'bg-green-500 text-white' : 'btn-accent'}`}
                      >
                        {event.isUserRegistered ? '✓ Registered' : event.spotsRemaining === 0 ? 'Full' : 'Register'}
                      </button>
                    ) : (
                      <span className="text-green-400 font-semibold text-xs sm:text-sm">No Registration Required</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-20">
          <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-600 mb-2">No Events Found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later for new events.</p>
        </div>
      )}
    </div>
  );
}
