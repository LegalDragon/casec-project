import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Save, X, Calendar, MapPin, Users, DollarSign,
  Upload, Image, FileText, Trash2, Download, Building2, Star, Tag, Clock
} from 'lucide-react';
import { eventsAPI, clubsAPI } from '../../services/api';
import { useAuthStore } from '../../store/useStore';
import api from '../../services/api';

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isAdmin;

  const [event, setEvent] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [assets, setAssets] = useState({ photos: [], documents: [] });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);

  const eventTypes = [
    { value: 'CasecEvent', label: 'CASEC Event', icon: '🎉' },
    { value: 'ClubEvent', label: 'Club Event', icon: '👥' },
    { value: 'PartnerEvent', label: 'Partner Event', icon: '🤝' },
    { value: 'Announcement', label: 'Announcement', icon: '📢' },
  ];

  const eventScopes = [
    { value: 'AllMembers', label: 'All Members' },
    { value: 'ClubMembers', label: 'Club Members Only' },
    { value: 'Public', label: 'Public' },
  ];

  useEffect(() => {
    fetchEvent();
    fetchClubs();
    fetchAssets();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await eventsAPI.getById(eventId);
      if (response.success) {
        setEvent(response.data);
        setFormData({
          title: response.data.title,
          description: response.data.description || '',
          eventDate: response.data.eventDate ? response.data.eventDate.slice(0, 16) : '',
          location: response.data.location || '',
          eventType: response.data.eventType || 'CasecEvent',
          eventCategory: response.data.eventCategory || '',
          eventScope: response.data.eventScope || 'AllMembers',
          hostClubId: response.data.hostClubId || '',
          partnerName: response.data.partnerName || '',
          partnerLogo: response.data.partnerLogo || '',
          partnerWebsite: response.data.partnerWebsite || '',
          registrationUrl: response.data.registrationUrl || '',
          eventFee: response.data.eventFee || 0,
          maxCapacity: response.data.maxCapacity || 100,
          isRegistrationRequired: response.data.isRegistrationRequired ?? true,
          isFeatured: response.data.isFeatured || false,
        });
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      alert('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await clubsAPI.getAll();
      setClubs(response.data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await api.get(`/events/${eventId}/assets`);
      if (response.success) {
        setAssets(response.data);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        hostClubId: formData.hostClubId ? parseInt(formData.hostClubId) : null,
        eventFee: parseFloat(formData.eventFee) || 0,
        maxCapacity: parseInt(formData.maxCapacity) || 100,
      };
      await eventsAPI.update(eventId, data);
      alert('Event updated successfully!');
      setEditing(false);
      fetchEvent();
    } catch (error) {
      console.error('Error updating event:', error);
      alert(error.message || 'Failed to update event');
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const response = await api.post(`/events/${eventId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.success) {
        alert(`Successfully uploaded ${response.data.length} photos`);
        fetchAssets();
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleDocumentUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDocs(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const response = await api.post(`/events/${eventId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.success) {
        alert(`Successfully uploaded ${response.data.length} documents`);
        fetchAssets();
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      alert('Failed to upload documents');
    } finally {
      setUploadingDocs(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleDeleteAsset = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await api.delete(`/events/${eventId}/assets/${fileId}`);
      if (response.success) {
        fetchAssets();
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  const getEventTypeInfo = (type) => {
    return eventTypes.find(t => t.value === type) || eventTypes[0];
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading event...</div>;
  }

  if (!event) {
    return <div className="text-center py-12">Event not found</div>;
  }

  const isPastEvent = new Date(event.eventDate) < new Date();
  const typeInfo = getEventTypeInfo(event.eventType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/events')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Events
        </button>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="btn btn-secondary flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn btn-primary flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Event
            </button>
          )}
        </div>
      </div>

      {/* Event Info Card */}
      <div className="card">
        {editing ? (
          /* Edit Form */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="input w-full"
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
                  className="input w-full"
                >
                  {eventScopes.map(scope => (
                    <option key={scope.value} value={scope.value}>{scope.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.eventCategory}
                  onChange={(e) => setFormData({ ...formData, eventCategory: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Host Club</label>
                <select
                  value={formData.hostClubId}
                  onChange={(e) => setFormData({ ...formData, hostClubId: e.target.value })}
                  className="input w-full"
                >
                  <option value="">No host club (CASEC Event)</option>
                  {clubs.map(club => (
                    <option key={club.clubId} value={club.clubId}>{club.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Fee ($)</label>
                <input
                  type="number"
                  value={formData.eventFee}
                  onChange={(e) => setFormData({ ...formData, eventFee: e.target.value })}
                  className="input w-full"
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
                  className="input w-full"
                  min="0"
                />
              </div>
              <div className="md:col-span-2 flex gap-6">
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

            {/* Partner Info */}
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
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Partner Website</label>
                    <input
                      type="url"
                      value={formData.partnerWebsite}
                      onChange={(e) => setFormData({ ...formData, partnerWebsite: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration URL</label>
                    <input
                      type="url"
                      value={formData.registrationUrl}
                      onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${isPastEvent ? 'bg-gray-200 text-gray-600' : 'bg-primary text-white'}`}>
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
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(event.eventDate)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.hostClubName && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-5 h-5" />
                  <span>{event.hostClubName}</span>
                </div>
              )}
              {event.eventCategory && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Tag className="w-5 h-5" />
                  <span>{event.eventCategory}</span>
                </div>
              )}
            </div>

            {event.description && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <DollarSign className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-semibold">${event.eventFee || 0}</p>
                <p className="text-xs text-gray-500">Fee</p>
              </div>
              <div className="text-center">
                <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-semibold">{event.maxCapacity || 'Unlimited'}</p>
                <p className="text-xs text-gray-500">Capacity</p>
              </div>
              <div className="text-center">
                <Users className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-semibold">{event.totalRegistrations || 0}</p>
                <p className="text-xs text-gray-500">Registered</p>
              </div>
              <div className="text-center">
                <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-semibold">{event.spotsRemaining}</p>
                <p className="text-xs text-gray-500">Spots Left</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Gallery Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Event Photos ({assets.photos.length})
          </h2>
          <div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhotos}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
            </button>
          </div>
        </div>

        {assets.photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {assets.photos.map((photo) => (
              <div key={photo.fileId} className="relative group">
                <img
                  src={photo.url}
                  alt={photo.fileName}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleDeleteAsset(photo.fileId)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No photos uploaded yet</p>
            <p className="text-sm">Upload photos to share event memories with members</p>
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Event Documents ({assets.documents.length})
          </h2>
          <div>
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              multiple
              onChange={handleDocumentUpload}
              className="hidden"
            />
            <button
              onClick={() => docInputRef.current?.click()}
              disabled={uploadingDocs}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploadingDocs ? 'Uploading...' : 'Upload Documents'}
            </button>
          </div>
        </div>

        {assets.documents.length > 0 ? (
          <div className="space-y-2">
            {assets.documents.map((doc) => (
              <div key={doc.fileId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-600 hover:text-primary"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => handleDeleteAsset(doc.fileId)}
                    className="p-2 text-gray-600 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No documents uploaded yet</p>
            <p className="text-sm">Upload event summaries, presentations, or other documents</p>
          </div>
        )}
      </div>
    </div>
  );
}
