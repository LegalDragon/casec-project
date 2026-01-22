import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Search, Calendar, MapPin, Users, Star,
  X, DollarSign, Clock, Tag, ExternalLink, Building2, Eye, ImageIcon, Upload, Link, Loader2
} from 'lucide-react';
import { eventsAPI, clubsAPI, utilityAPI, eventTypesAPI, getAssetUrl } from '../../services/api';
import { useAuthStore } from '../../store/useStore';
import { useTheme } from '../../components/ThemeProvider';

export default function AdminEvents() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const appName = theme?.organizationName || 'Organization';
  const isSystemAdmin = user?.isAdmin;

  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTime, setFilterTime] = useState('all');
  const [filterClub, setFilterClub] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    location: '',
    eventType: 'CasecEvent',
    eventCategory: '',
    eventScope: 'AllMembers',
    hostClubId: '',
    partnerName: '',
    partnerLogo: '',
    partnerWebsite: '',
    registrationUrl: '',
    eventFee: 0,
    maxCapacity: 100,
    isRegistrationRequired: true,
    isFeatured: false,
  });

  // URL thumbnail fetching states
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [fetchedMetadata, setFetchedMetadata] = useState(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [savingThumbnail, setSavingThumbnail] = useState(false);
  const [sourceUrl, setSourceUrl] = useState(''); // URL used to generate thumbnail

  // Event types from API
  const [eventTypes, setEventTypes] = useState([]);

  const eventScopes = [
    { value: 'AllMembers', label: 'All Members' },
    { value: 'ClubSpecific', label: 'Club Specific' },
  ];

  useEffect(() => {
    fetchEvents();
    fetchClubs();
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const response = await eventTypesAPI.getAll();
      if (response.success && response.data) {
        // Map API response to format used by the component
        setEventTypes(response.data.map(et => ({
          value: et.code,
          label: et.displayName,
          icon: et.icon || 'Calendar',
          color: et.color || 'primary',
          allowsRegistration: et.allowsRegistration,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch event types:', error);
      // Fallback to default types if API fails
      setEventTypes([
        { value: 'CasecEvent', label: 'Community Event', icon: 'Calendar', color: 'primary', allowsRegistration: true },
        { value: 'PartnerEvent', label: 'Partner Event', icon: 'Handshake', color: 'accent', allowsRegistration: true },
        { value: 'Announcement', label: 'Announcement', icon: 'Megaphone', color: 'info', allowsRegistration: false },
      ]);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAllAdmin();
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await clubsAPI.getAll();
      // Filter to only clubs user can admin (for club admins)
      if (isSystemAdmin) {
        setClubs(response.data || []);
      } else {
        const adminClubs = (response.data || []).filter(c => c.isUserAdmin);
        setClubs(adminClubs);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      location: '',
      eventType: 'CasecEvent',
      eventCategory: '',
      eventScope: 'AllMembers',
      hostClubId: '',
      partnerName: '',
      partnerLogo: '',
      partnerWebsite: '',
      registrationUrl: '',
      eventFee: 0,
      maxCapacity: 100,
      isRegistrationRequired: true,
      isFeatured: false,
    });
    // Reset thumbnail states
    setThumbnailUrl('');
    setFetchedMetadata(null);
    setThumbnailPreview('');
    setSourceUrl('');
  };

  const handleFetchMetadata = async () => {
    if (!thumbnailUrl.trim()) {
      alert('Please enter a URL first');
      return;
    }

    setFetchingMetadata(true);
    setFetchedMetadata(null);

    try {
      const response = await utilityAPI.fetchUrlMetadata(thumbnailUrl);
      if (response.success && response.data) {
        setFetchedMetadata(response.data);
        // Save the URL as source URL for the event
        setSourceUrl(thumbnailUrl);
        // Don't auto-select - let user pick from the grid
      } else {
        alert(response.message || 'Failed to fetch metadata from URL');
      }
    } catch (error) {
      console.error('Error fetching URL metadata:', error);
      alert(error.message || 'Failed to fetch metadata from URL');
    } finally {
      setFetchingMetadata(false);
    }
  };

  // Save selected thumbnail image locally (only works for existing events)
  const handleSaveThumbnailLocally = async () => {
    if (!editingEvent || !thumbnailPreview || !thumbnailPreview.startsWith('http')) {
      return;
    }

    setSavingThumbnail(true);
    try {
      const response = await eventsAPI.saveThumbnailFromUrl(editingEvent.eventId, thumbnailPreview);
      if (response.success) {
        setEditingEvent({ ...editingEvent, thumbnailUrl: response.data.url });
        setThumbnailPreview(response.data.url);
      } else {
        alert(response.message || 'Failed to save thumbnail');
      }
    } catch (error) {
      console.error('Error saving thumbnail:', error);
      alert(error.message || 'Failed to save thumbnail');
    } finally {
      setSavingThumbnail(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        hostClubId: formData.hostClubId ? parseInt(formData.hostClubId) : null,
        eventFee: parseFloat(formData.eventFee) || 0,
        maxCapacity: parseInt(formData.maxCapacity) || 100,
        thumbnailUrl: thumbnailPreview || null,
        sourceUrl: sourceUrl || null,
      };
      await eventsAPI.create(data);
      alert('Event created successfully!');
      setShowCreateModal(false);
      resetFormData();
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert(error.message || 'Failed to create event');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      eventDate: event.eventDate ? event.eventDate.slice(0, 16) : '',
      location: event.location || '',
      eventType: event.eventType || 'CasecEvent',
      eventCategory: event.eventCategory || '',
      eventScope: event.eventScope || 'AllMembers',
      hostClubId: event.hostClubId || '',
      partnerName: event.partnerName || '',
      partnerLogo: event.partnerLogo || '',
      partnerWebsite: event.partnerWebsite || '',
      registrationUrl: event.registrationUrl || '',
      eventFee: event.eventFee || 0,
      maxCapacity: event.maxCapacity || 100,
      isRegistrationRequired: event.isRegistrationRequired ?? true,
      isFeatured: event.isFeatured || false,
    });
    // Set existing thumbnail preview and source URL
    setThumbnailUrl('');
    setFetchedMetadata(null);
    setThumbnailPreview(event.thumbnailUrl || '');
    setSourceUrl(event.sourceUrl || '');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        hostClubId: formData.hostClubId ? parseInt(formData.hostClubId) : null,
        eventFee: parseFloat(formData.eventFee) || 0,
        maxCapacity: parseInt(formData.maxCapacity) || 100,
        sourceUrl: sourceUrl || null,
      };
      // Include external thumbnail URL if it's different from the current one
      if (thumbnailPreview && thumbnailPreview.startsWith('http') && thumbnailPreview !== editingEvent.thumbnailUrl) {
        data.thumbnailUrl = thumbnailPreview;
      }
      await eventsAPI.update(editingEvent.eventId, data);
      alert('Event updated successfully!');
      setEditingEvent(null);
      resetFormData();
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      alert(error.message || 'Failed to update event');
    }
  };

  const handleDelete = async (eventId, eventTitle) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This will also delete all registrations.`)) return;

    try {
      await eventsAPI.delete(eventId);
      alert('Event deleted successfully!');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(error.message || 'Failed to delete event');
    }
  };

  const getEventTypeInfo = (type) => {
    const found = eventTypes.find(t => t.value === type);
    if (found) return found;
    // Return first type or default if not found
    return eventTypes[0] || { value: type, label: type, icon: 'Calendar', color: 'primary' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPastEvent = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || event.eventType === filterType;

    const matchesTime = filterTime === 'all' ||
      (filterTime === 'upcoming' && !isPastEvent(event.eventDate)) ||
      (filterTime === 'past' && isPastEvent(event.eventDate));

    const matchesClub = filterClub === 'all' ||
      (filterClub === 'casec' && !event.hostClubId) ||
      (event.hostClubId && event.hostClubId.toString() === filterClub);

    const eventDate = new Date(event.eventDate);
    const matchesDateFrom = !filterDateFrom || eventDate >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || eventDate <= new Date(filterDateTo + 'T23:59:59');

    return matchesSearch && matchesType && matchesTime && matchesClub && matchesDateFrom && matchesDateTo;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Events</h1>
          <p className="text-gray-600 mt-1">
            {isSystemAdmin ? 'Manage all events and announcements' : 'Manage events for your clubs'}
          </p>
        </div>
        <button
          onClick={() => {
            resetFormData();
            setShowCreateModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input w-full"
          >
            <option value="all">All Types</option>
            {eventTypes.map(type => (
              <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
            ))}
          </select>
          <select
            value={filterClub}
            onChange={(e) => setFilterClub(e.target.value)}
            className="input w-full"
          >
            <option value="all">All Clubs</option>
            <option value="casec">{appName} (No Club)</option>
            {clubs.map(club => (
              <option key={club.clubId} value={club.clubId}>{club.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
            className="input w-full"
          >
            <option value="all">All Time</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="input w-full"
            />
          </div>
        </div>
        {(searchTerm || filterType !== 'all' || filterTime !== 'all' || filterClub !== 'all' || filterDateFrom || filterDateTo) && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-gray-500">
              Showing {filteredEvents.length} of {events.length} events
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterTime('all');
                setFilterClub('all');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
              className="text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((event) => {
          const typeInfo = getEventTypeInfo(event.eventType);
          const past = isPastEvent(event.eventDate);

          return (
            <div
              key={event.eventId}
              className={`card ${past ? 'opacity-60 bg-gray-50' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Event Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{typeInfo.icon}</span>
                    <h3 className="font-semibold text-lg text-gray-900">{event.title}</h3>
                    {event.isFeatured && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Featured
                      </span>
                    )}
                    {past && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">
                        Past
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.eventDate)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                    )}
                    {event.hostClubName && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {event.hostClubName}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {typeInfo.label}
                    </span>
                    {event.eventCategory && (
                      <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {event.eventCategory}
                      </span>
                    )}
                    {event.eventFee > 0 && (
                      <span className="px-2 py-1 rounded bg-green-100 text-green-800 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${event.eventFee}
                      </span>
                    )}
                    {event.maxCapacity > 0 && (
                      <span className="px-2 py-1 rounded bg-orange-100 text-orange-800 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.totalRegistrations || 0}/{event.maxCapacity}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/events/${event.eventId}`)}
                    className="btn btn-secondary btn-sm flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(event)}
                    className="btn btn-secondary btn-sm flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.eventId, event.title)}
                    className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || filterType !== 'all' || filterTime !== 'all'
              ? 'No events match your filters'
              : 'No events yet. Create your first event!'}
          </p>
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {(showCreateModal || editingEvent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">
                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                  </h2>
                  {editingEvent && (
                    <a
                      href={`/event/${editingEvent.eventId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm flex items-center gap-1"
                      title="View as public"
                    >
                      <Eye className="w-4 h-4" />
                      Public View
                    </a>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                    resetFormData();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={editingEvent ? handleUpdate : handleCreate} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="input"
                      required
                    >
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Scope</label>
                    <select
                      value={formData.eventScope}
                      onChange={(e) => setFormData({ ...formData, eventScope: e.target.value })}
                      className="input"
                    >
                      {eventScopes.map(scope => (
                        <option key={scope.value} value={scope.value}>{scope.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="input"
                      placeholder="e.g., Community Center"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.eventCategory}
                      onChange={(e) => setFormData({ ...formData, eventCategory: e.target.value })}
                      className="input"
                      placeholder="e.g., Social, Workshop, Sports"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Host Club</label>
                    <select
                      value={formData.hostClubId}
                      onChange={(e) => setFormData({ ...formData, hostClubId: e.target.value })}
                      className="input"
                    >
                      <option value="">No host club ({appName} Event)</option>
                      {clubs.map(club => (
                        <option key={club.clubId} value={club.clubId}>{club.name}</option>
                      ))}
                    </select>
                    {!isSystemAdmin && !formData.hostClubId && (
                      <p className="text-xs text-amber-600 mt-1">Club admins must select a host club</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Event description..."
                  />
                </div>

                {/* Event Thumbnail Section */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Event Thumbnail
                  </h3>

                  {/* URL Fetch Section */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Generate from URL
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Paste a URL to automatically fetch its thumbnail image (e.g., event page, news article)
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="url"
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                          className="input pl-10 w-full"
                          placeholder="https://example.com/event-page"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleFetchMetadata}
                        disabled={fetchingMetadata || !thumbnailUrl.trim()}
                        className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
                      >
                        {fetchingMetadata ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Fetch
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Fetched Metadata Preview */}
                  {fetchedMetadata && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      {/* Page Info */}
                      <div className="mb-3">
                        {fetchedMetadata.title && (
                          <p className="font-medium text-sm text-gray-900">{fetchedMetadata.title}</p>
                        )}
                        {fetchedMetadata.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 mt-1">{fetchedMetadata.description}</p>
                        )}
                        {fetchedMetadata.siteName && (
                          <p className="text-xs text-blue-600 mt-1">{fetchedMetadata.siteName}</p>
                        )}
                      </div>

                      {/* Image Grid - Pick from available images */}
                      {fetchedMetadata.images && fetchedMetadata.images.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Select a thumbnail ({fetchedMetadata.images.length} images found):
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                            {fetchedMetadata.images.map((imageUrl, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setThumbnailPreview(imageUrl)}
                                className={`relative aspect-video rounded border-2 overflow-hidden transition-all ${
                                  thumbnailPreview === imageUrl
                                    ? 'border-primary ring-2 ring-primary/30'
                                    : 'border-gray-200 hover:border-gray-400'
                                }`}
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Option ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    if (e.target?.parentElement) {
                                      e.target.parentElement.style.display = 'none';
                                    }
                                  }}
                                />
                                {thumbnailPreview === imageUrl && (
                                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <div className="bg-primary text-white rounded-full p-1">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Click an image to select it as the event thumbnail
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600">No images found on this page</p>
                      )}
                    </div>
                  )}

                  {/* Direct Image URL Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Or paste image URL directly
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={thumbnailPreview.startsWith('http') ? thumbnailPreview : ''}
                        onChange={(e) => setThumbnailPreview(e.target.value)}
                        className="input flex-1"
                        placeholder="https://example.com/image.jpg"
                      />
                      {editingEvent && thumbnailPreview && thumbnailPreview.startsWith('http') && (
                        <button
                          type="button"
                          onClick={handleSaveThumbnailLocally}
                          disabled={savingThumbnail}
                          className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
                        >
                          {savingThumbnail ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Save Locally
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Paste an image URL directly, or select from images above
                    </p>
                  </div>

                  {/* Current Thumbnail Preview */}
                  <div className="flex items-start gap-4">
                    {thumbnailPreview ? (
                      <div className="relative">
                        <img
                          src={thumbnailPreview.startsWith('/api') ? getAssetUrl(thumbnailPreview) : thumbnailPreview}
                          alt="Event thumbnail"
                          className="w-32 h-24 object-cover rounded-lg border"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            if (e.target) {
                              e.target.src = '';
                              e.target.style.display = 'none';
                            }
                            if (e.target?.parentElement) {
                              e.target.parentElement.innerHTML = '<div class="w-32 h-24 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center text-xs text-red-500 text-center p-2">Image failed to load</div>';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setThumbnailPreview('')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          title="Remove thumbnail"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {thumbnailPreview.startsWith('http') && (
                          <span className="absolute -bottom-1 left-0 right-0 text-center">
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1 rounded">
                              External
                            </span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-32 h-24 bg-gray-100 rounded-lg border flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      {/* File Upload - For editing existing events */}
                      {editingEvent && (
                        <label className="block mb-2">
                          <span className="btn btn-secondary btn-sm cursor-pointer inline-flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const response = await eventsAPI.uploadThumbnail(editingEvent.eventId, file);
                                  if (response.success) {
                                    setEditingEvent({ ...editingEvent, thumbnailUrl: response.data.url });
                                    setThumbnailPreview(response.data.url);
                                  }
                                } catch (error) {
                                  alert('Failed to upload thumbnail: ' + (error.message || 'Unknown error'));
                                }
                              }
                            }}
                          />
                        </label>
                      )}
                      <p className="text-xs text-gray-500">
                        {editingEvent
                          ? 'Upload an image, paste URL, or fetch from a page above.'
                          : 'Use the URL fetch above or paste an image URL. You can save images locally after creating the event.'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Recommended size: 800x400px
                      </p>
                      {editingEvent && thumbnailPreview && thumbnailPreview.startsWith('http') && (
                        <p className="text-xs text-amber-600 mt-1">
                          Click "Save Locally" to download and store this image on the server.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Registration & Capacity */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Registration Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Fee ($)</label>
                      <input
                        type="number"
                        value={formData.eventFee}
                        onChange={(e) => setFormData({ ...formData, eventFee: e.target.value })}
                        className="input"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                      <input
                        type="number"
                        value={formData.maxCapacity}
                        onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                        className="input"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration URL</label>
                      <input
                        type="url"
                        value={formData.registrationUrl}
                        onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                        className="input"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-6 mt-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isRegistrationRequired}
                        onChange={(e) => setFormData({ ...formData, isRegistrationRequired: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Registration Required</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Featured Event</span>
                    </label>
                  </div>
                </div>

                {/* Partner Info (for Partner Events) */}
                {formData.eventType === 'PartnerEvent' && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-3">Partner Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name</label>
                        <input
                          type="text"
                          value={formData.partnerName}
                          onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partner Logo URL</label>
                        <input
                          type="url"
                          value={formData.partnerLogo}
                          onChange={(e) => setFormData({ ...formData, partnerLogo: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partner Website</label>
                        <input
                          type="url"
                          value={formData.partnerWebsite}
                          onChange={(e) => setFormData({ ...formData, partnerWebsite: e.target.value })}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingEvent(null);
                      resetFormData();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!isSystemAdmin && !formData.hostClubId}
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Event Modal */}
      {viewingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{viewingEvent.title}</h2>
                <button
                  onClick={() => setViewingEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                    {getEventTypeInfo(viewingEvent.eventType).icon} {getEventTypeInfo(viewingEvent.eventType).label}
                  </span>
                  {viewingEvent.isFeatured && (
                    <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm flex items-center gap-1">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                    {viewingEvent.eventScope}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>{formatDate(viewingEvent.eventDate)}</span>
                  </div>
                  {viewingEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span>{viewingEvent.location}</span>
                    </div>
                  )}
                  {viewingEvent.hostClubName && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span>{viewingEvent.hostClubName}</span>
                    </div>
                  )}
                  {viewingEvent.eventCategory && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-gray-400" />
                      <span>{viewingEvent.eventCategory}</span>
                    </div>
                  )}
                </div>

                {viewingEvent.description && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Description</h3>
                    <p className="text-gray-600">{viewingEvent.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <DollarSign className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-semibold">${viewingEvent.eventFee || 0}</p>
                    <p className="text-xs text-gray-500">Fee</p>
                  </div>
                  <div className="text-center">
                    <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-semibold">{viewingEvent.maxCapacity || 'Unlimited'}</p>
                    <p className="text-xs text-gray-500">Capacity</p>
                  </div>
                  <div className="text-center">
                    <Users className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="text-lg font-semibold">{viewingEvent.totalRegistrations || 0}</p>
                    <p className="text-xs text-gray-500">Registered</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-semibold">{viewingEvent.spotsRemaining}</p>
                    <p className="text-xs text-gray-500">Spots Left</p>
                  </div>
                </div>

                {viewingEvent.registrationUrl && (
                  <a
                    href={viewingEvent.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Registration Link
                  </a>
                )}

                {viewingEvent.sourceUrl && (
                  <a
                    href={viewingEvent.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Link className="w-4 h-4" />
                    Event Source
                  </a>
                )}

                {viewingEvent.partnerName && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Partner Information</h3>
                    <p className="text-gray-600">{viewingEvent.partnerName}</p>
                    {viewingEvent.partnerWebsite && (
                      <a
                        href={viewingEvent.partnerWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Visit Partner Website
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setViewingEvent(null);
                    handleEdit(viewingEvent);
                  }}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Event
                </button>
                <button
                  onClick={() => setViewingEvent(null)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
