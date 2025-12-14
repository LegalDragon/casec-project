import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, MapPin, Users, DollarSign, Building2, Star,
  Tag, Clock, Image, FileText, Download, ExternalLink, UserCheck, UserX
} from 'lucide-react';
import api, { getAssetUrl } from '../services/api';
import { useAuthStore } from '../store/useStore';

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [unregistering, setUnregistering] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const eventTypes = {
    'CasecEvent': { label: 'CASEC Event', icon: '🎉', color: 'bg-primary' },
    'ClubEvent': { label: 'Club Event', icon: '👥', color: 'bg-blue-500' },
    'PartnerEvent': { label: 'Partner Event', icon: '🤝', color: 'bg-purple-500' },
    'Announcement': { label: 'Announcement', icon: '📢', color: 'bg-yellow-500' },
  };

  useEffect(() => {
    fetchEventDetail();
  }, [eventId]);

  const fetchEventDetail = async () => {
    try {
      const response = await api.get(`/events/${eventId}/detail`);
      if (response.success) {
        setEvent(response.data);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      alert('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setRegistering(true);
    try {
      const response = await api.post(`/events/${eventId}/register`, {
        eventId: parseInt(eventId),
        numberOfGuests: 0
      });
      if (response.success) {
        alert('Successfully registered for event!');
        fetchEventDetail();
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert(error.message || 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!confirm('Are you sure you want to unregister from this event?')) {
      return;
    }

    setUnregistering(true);
    try {
      const response = await api.post(`/events/${eventId}/unregister`);
      if (response.success) {
        alert('Successfully unregistered from event');
        fetchEventDetail();
      }
    } catch (error) {
      console.error('Error unregistering:', error);
      alert(error.message || 'Failed to unregister from event');
    } finally {
      setUnregistering(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h2>
        <button onClick={() => navigate('/events')} className="btn btn-primary">
          Back to Events
        </button>
      </div>
    );
  }

  const typeInfo = eventTypes[event.eventType] || eventTypes['CasecEvent'];
  const isPastEvent = new Date(event.eventDate) < new Date();
  const canRegister = !isPastEvent && event.isRegistrationRequired && !event.isUserRegistered && event.spotsRemaining > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/events')}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Events
      </button>

      {/* Event Thumbnail Banner */}
      {event.thumbnailUrl && (
        <div className="rounded-xl overflow-hidden shadow-lg">
          <img
            src={getAssetUrl(event.thumbnailUrl)}
            alt={event.title}
            className="w-full h-64 md:h-80 object-cover"
          />
        </div>
      )}

      {/* Event Hero */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${typeInfo.color}`}>
                {typeInfo.icon} {typeInfo.label}
              </span>
              {event.isFeatured && (
                <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Featured
                </span>
              )}
              {isPastEvent && (
                <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-sm">
                  Past Event
                </span>
              )}
              {event.eventCategory && (
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {event.eventCategory}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>{formatDate(event.eventDate)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.hostClubName && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span>Hosted by {event.hostClubName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Registration Card - only show for upcoming events */}
          {!isPastEvent && (
            <div className="md:w-64 bg-gray-50 rounded-lg p-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-primary">
                  {event.eventFee > 0 ? `$${event.eventFee}` : 'Free'}
                </p>
                {event.isRegistrationRequired && (
                  <p className="text-sm text-gray-500">
                    {event.spotsRemaining} spots remaining
                  </p>
                )}
              </div>

              {canRegister && (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="btn btn-primary w-full mb-3"
                >
                  {registering ? 'Registering...' : 'Register Now'}
                </button>
              )}

              {event.isUserRegistered && (
                <div className="mb-3">
                  <div className="flex items-center justify-center gap-2 text-green-600 font-medium mb-2">
                    <UserCheck className="w-5 h-5" />
                    You're registered!
                  </div>
                  <button
                    onClick={handleUnregister}
                    disabled={unregistering}
                    className="btn w-full bg-red-100 text-red-700 hover:bg-red-200 flex items-center justify-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    {unregistering ? 'Unregistering...' : 'Unregister'}
                  </button>
                </div>
              )}

              {event.registrationUrl && (
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  External Registration
                </a>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Capacity</span>
                  <span className="font-medium">{event.maxCapacity || 'Unlimited'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Registered</span>
                  <span className="font-medium">{event.totalRegistrations}</span>
                </div>
              </div>
            </div>
          )}

          {/* Past Event Attendance Badge */}
          {isPastEvent && event.isUserRegistered && (
            <div className="md:w-64 bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                <UserCheck className="w-5 h-5" />
                You attended!
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">About This Event</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* External Source Link */}
        {event.sourceUrl && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-primary" />
              Event Source
            </h3>
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl hover:from-primary/10 hover:to-accent/10 hover:border-primary/30 transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                  View Original Event Details
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {event.sourceUrl}
                </p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
            </a>
          </div>
        )}

        {/* Partner Info */}
        {event.eventType === 'PartnerEvent' && event.partnerName && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Partner Information</h3>
            <div className="flex items-center gap-4">
              {event.partnerLogo && (
                <img src={getAssetUrl(event.partnerLogo)} alt={event.partnerName} className="h-12 w-auto" />
              )}
              <div>
                <p className="font-medium text-gray-900">{event.partnerName}</p>
                {event.partnerWebsite && (
                  <a
                    href={event.partnerWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Gallery */}
      {event.photos && event.photos.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Event Photos ({event.photos.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {event.photos.map((photo) => (
              <div
                key={photo.fileId}
                className="relative cursor-pointer group"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={getAssetUrl(photo.url)}
                  alt={photo.caption || photo.fileName}
                  className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
                />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 rounded-b-lg truncate">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {event.documents && event.documents.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Event Documents ({event.documents.length})
          </h2>
          <div className="space-y-2">
            {event.documents.map((doc) => (
              <div key={doc.fileId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.fileSize)}
                      {doc.caption && ` • ${doc.caption}`}
                    </p>
                  </div>
                </div>
                <a
                  href={getAssetUrl(doc.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-primary"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registrants */}
      {isAuthenticated && event.registrants && event.registrants.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Registered Attendees ({event.registrants.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.registrants.map((registrant) => (
              <Link
                key={registrant.userId}
                to={`/member/${registrant.userId}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {registrant.avatarUrl ? (
                  <img
                    src={getAssetUrl(registrant.avatarUrl)}
                    alt={`${registrant.firstName} ${registrant.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                    {registrant.firstName[0]}{registrant.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {registrant.firstName} {registrant.lastName}
                  </p>
                  {registrant.numberOfGuests > 0 && (
                    <p className="text-xs text-gray-500">+{registrant.numberOfGuests} guest(s)</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={getAssetUrl(selectedPhoto.url)}
              alt={selectedPhoto.caption || selectedPhoto.fileName}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {selectedPhoto.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 rounded-b-lg">
                {selectedPhoto.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
