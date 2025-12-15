import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Save, X, Calendar, MapPin, Users, DollarSign,
  Upload, Image, FileText, Trash2, Download, Building2, Star, Tag, Clock,
  Eye, EyeOff, ArrowUp, ArrowDown, GripVertical
} from 'lucide-react';
import { eventsAPI, clubsAPI, eventTypesAPI, getAssetUrl } from '../../services/api';
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

  // Event types from API
  const [eventTypes, setEventTypes] = useState([]);

  const eventScopes = [
    { value: 'AllMembers', label: 'All Members' },
    { value: 'ClubMembers', label: 'Club Members Only' },
    { value: 'Public', label: 'Public' },
  ];

  useEffect(() => {
    fetchEvent();
    fetchClubs();
    fetchAssets();
    fetchEventTypes();
  }, [eventId]);

  const fetchEventTypes = async () => {
    try {
      const response = await eventTypesAPI.getAll();
      if (response.success && response.data) {
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
      // Include private assets for admin view
      const response = await api.get(`/events/${eventId}/assets?includePrivate=true`);
      if (response.success) {
        setAssets(response.data);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleUpdateAsset = async (fileId, updates) => {
    try {
      const response = await api.put(`/events/${eventId}/assets/${fileId}`, updates);
      if (response.success) {
        fetchAssets();
      }
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('Failed to update asset');
    }
  };

  const handleToggleStatus = async (fileId, currentStatus) => {
    const newStatus = currentStatus === 'Public' ? 'Private' : 'Public';
    await handleUpdateAsset(fileId, { status: newStatus });
  };

  const handleUpdateSortOrder = async (fileId, sortOrder) => {
    await handleUpdateAsset(fileId, { sortOrder: parseInt(sortOrder) || 0 });
  };

  const handleUpdateCaption = async (fileId, caption) => {
    await handleUpdateAsset(fileId, { caption });
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
    const found = eventTypes.find(t => t.value === type);
    if (found) return found;
    // Return first type or default if not found
    return eventTypes[0] || { value: type, label: type, icon: 'Calendar', color: 'primary' };
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {assets.photos.filter(p => p.status === 'Public').length} public
            </span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.photos.map((photo) => (
              <div key={photo.fileId} className={`border rounded-lg overflow-hidden ${photo.status === 'Private' ? 'border-gray-300 bg-gray-50' : 'border-green-300 bg-green-50'}`}>
                <div className="relative">
                  <img
                    src={getAssetUrl(photo.url)}
                    alt={photo.fileName}
                    className={`w-full h-40 object-cover ${photo.status === 'Private' ? 'opacity-60' : ''}`}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${photo.status === 'Public' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                      {photo.status}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{photo.fileName}</p>

                  {/* Caption Input */}
                  <input
                    type="text"
                    placeholder="Add caption..."
                    defaultValue={photo.caption || ''}
                    onBlur={(e) => {
                      if (e.target.value !== (photo.caption || '')) {
                        handleUpdateCaption(photo.fileId, e.target.value);
                      }
                    }}
                    className="input w-full text-sm py-1"
                  />

                  <div className="flex items-center justify-between gap-2">
                    {/* Sort Order */}
                    <div className="flex items-center gap-1">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        defaultValue={photo.sortOrder}
                        onBlur={(e) => handleUpdateSortOrder(photo.fileId, e.target.value)}
                        className="input w-16 text-sm py-1 text-center"
                        title="Sort order (lower = first)"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(photo.fileId, photo.status)}
                        className={`p-2 rounded ${photo.status === 'Public' ? 'text-green-600 hover:bg-green-100' : 'text-gray-600 hover:bg-gray-200'}`}
                        title={photo.status === 'Public' ? 'Make Private' : 'Make Public'}
                      >
                        {photo.status === 'Public' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(photo.fileId)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {assets.documents.filter(d => d.status === 'Public').length} public
            </span>
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
          <div className="space-y-3">
            {assets.documents.map((doc) => (
              <div key={doc.fileId} className={`p-4 rounded-lg border ${doc.status === 'Private' ? 'border-gray-300 bg-gray-50' : 'border-green-300 bg-green-50'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className={`w-10 h-10 flex-shrink-0 ${doc.status === 'Private' ? 'text-gray-400' : 'text-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">{doc.fileName}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${doc.status === 'Public' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>

                      {/* Caption Input */}
                      <input
                        type="text"
                        placeholder="Add description..."
                        defaultValue={doc.caption || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (doc.caption || '')) {
                            handleUpdateCaption(doc.fileId, e.target.value);
                          }
                        }}
                        className="input w-full text-sm py-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sort Order */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        defaultValue={doc.sortOrder}
                        onBlur={(e) => handleUpdateSortOrder(doc.fileId, e.target.value)}
                        className="input w-14 text-sm py-1 text-center"
                        title="Sort order"
                      />
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleToggleStatus(doc.fileId, doc.status)}
                      className={`p-2 rounded ${doc.status === 'Public' ? 'text-green-600 hover:bg-green-100' : 'text-gray-600 hover:bg-gray-200'}`}
                      title={doc.status === 'Public' ? 'Make Private' : 'Make Public'}
                    >
                      {doc.status === 'Public' ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <a
                      href={getAssetUrl(doc.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-primary rounded hover:bg-blue-50"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDeleteAsset(doc.fileId)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
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

      {/* Registrants Section */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Registered Attendees ({event.totalRegistrations || 0})
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          View the <Link to={`/events/${eventId}`} className="text-primary hover:underline">public event page</Link> to see the full registrant list.
        </p>
      </div>
    </div>
  );
}
