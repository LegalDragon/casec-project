import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Search, Users, Shield, ShieldOff,
  Calendar, Mail, Image, X, UserPlus, CheckCircle, XCircle
} from 'lucide-react';
import { clubsAPI, usersAPI, getAssetUrl } from '../../services/api';
import { useAuthStore } from '../../store/useStore';

export default function AdminClubs() {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isAdmin;

  const [clubs, setClubs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [managingMembers, setManagingMembers] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meetingSchedule: '',
    contactEmail: '',
    foundedDate: '',
  });

  useEffect(() => {
    fetchClubs();
    if (isSystemAdmin) {
      fetchAllUsers();
    }
  }, [isSystemAdmin]);

  const fetchClubs = async () => {
    try {
      const response = await clubsAPI.getAll();
      // Filter clubs for club admins - they can only manage clubs they admin
      if (isSystemAdmin) {
        setClubs(response.data || []);
      } else {
        // Filter to only show clubs where user is an admin
        const userClubs = (response.data || []).filter(club => club.isUserAdmin);
        setClubs(userClubs);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      alert('Failed to fetch clubs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setAllUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await clubsAPI.create(formData);
      alert('Club created successfully!');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', meetingSchedule: '', contactEmail: '', foundedDate: '' });
      fetchClubs();
    } catch (error) {
      console.error('Error creating club:', error);
      alert(error.message || 'Failed to create club');
    }
  };

  const handleEdit = (club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      description: club.description || '',
      meetingSchedule: club.meetingSchedule || '',
      contactEmail: club.contactEmail || '',
      foundedDate: club.foundedDate ? club.foundedDate.split('T')[0] : '',
      isActive: club.isActive,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await clubsAPI.update(editingClub.clubId, formData);
      alert('Club updated successfully!');
      setEditingClub(null);
      fetchClubs();
    } catch (error) {
      console.error('Error updating club:', error);
      alert(error.message || 'Failed to update club');
    }
  };

  const handleDelete = async (clubId, clubName) => {
    if (!confirm(`Are you sure you want to deactivate "${clubName}"?`)) return;

    try {
      await clubsAPI.update(clubId, { isActive: false });
      alert('Club deactivated successfully!');
      fetchClubs();
    } catch (error) {
      console.error('Error deactivating club:', error);
      alert(error.message || 'Failed to deactivate club');
    }
  };

  const handleActivate = async (clubId) => {
    try {
      await clubsAPI.update(clubId, { isActive: true });
      alert('Club activated successfully!');
      fetchClubs();
    } catch (error) {
      console.error('Error activating club:', error);
      alert(error.message || 'Failed to activate club');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await clubsAPI.uploadAvatar(uploadingAvatar.clubId, file);
      alert('Avatar uploaded successfully!');
      setUploadingAvatar(null);
      fetchClubs();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(error.message || 'Failed to upload avatar');
    }
  };

  const handleAssignAdmin = async (clubId, userId) => {
    try {
      await clubsAPI.assignAdmin(clubId, userId);
      alert('Admin assigned successfully!');
      fetchClubs();
      // Refresh the managing members modal
      const response = await clubsAPI.getById(clubId);
      setManagingMembers(response.data);
    } catch (error) {
      console.error('Error assigning admin:', error);
      alert(error.message || 'Failed to assign admin. User must be a club member first.');
    }
  };

  const handleRemoveAdmin = async (clubId, userId) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;

    try {
      await clubsAPI.removeAdmin(clubId, userId);
      alert('Admin removed successfully!');
      fetchClubs();
      // Refresh the managing members modal
      const response = await clubsAPI.getById(clubId);
      setManagingMembers(response.data);
    } catch (error) {
      console.error('Error removing admin:', error);
      alert(error.message || 'Failed to remove admin');
    }
  };

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (club.description && club.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get users who are not already admins of the selected club
  const getAvailableUsersForAdmin = (club) => {
    const adminUserIds = club.admins?.map(a => a.userId) || [];
    return allUsers.filter(u => !adminUserIds.includes(u.userId) && u.isActive);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading clubs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Clubs</h1>
          <p className="text-gray-600 mt-1">
            {isSystemAdmin ? 'Manage all clubs and their administrators' : 'Manage clubs you administer'}
          </p>
        </div>
        {isSystemAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Club
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search clubs by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10 w-full"
        />
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClubs.map((club) => (
          <div key={club.clubId} className={`card ${!club.isActive ? 'opacity-60 border-red-200' : ''}`}>
            {/* Club Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {club.avatarUrl ? (
                  <img
                    src={getAssetUrl(club.avatarUrl)}
                    alt={club.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                    {club.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{club.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-3 h-3" />
                    {club.totalMembers || 0} members
                  </div>
                </div>
              </div>
              {!club.isActive && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
            </div>

            {/* Club Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {club.description || 'No description available'}
            </p>

            {/* Club Info */}
            <div className="space-y-2 text-sm text-gray-500 mb-4">
              {club.meetingSchedule && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {club.meetingSchedule}
                </div>
              )}
              {club.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {club.contactEmail}
                </div>
              )}
            </div>

            {/* Admins */}
            {club.admins && club.admins.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Club Admins:</p>
                <div className="flex flex-wrap gap-1">
                  {club.admins.map((admin) => (
                    <span
                      key={admin.userId}
                      className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      {admin.userName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <button
                onClick={() => handleEdit(club)}
                className="btn btn-secondary btn-sm flex items-center gap-1"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => setUploadingAvatar(club)}
                className="btn btn-secondary btn-sm flex items-center gap-1"
              >
                <Image className="w-3 h-3" />
                Avatar
              </button>
              {isSystemAdmin && (
                <>
                  <button
                    onClick={() => setManagingMembers(club)}
                    className="btn btn-secondary btn-sm flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    Admins
                  </button>
                  {club.isActive ? (
                    <button
                      onClick={() => handleDelete(club.clubId, club.name)}
                      className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(club.clubId)}
                      className="btn btn-sm bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Activate
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No clubs match your search' : 'No clubs to manage'}
          </p>
        </div>
      )}

      {/* Create Club Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Create New Club</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Schedule</label>
                  <input
                    type="text"
                    value={formData.meetingSchedule}
                    onChange={(e) => setFormData({ ...formData, meetingSchedule: e.target.value })}
                    className="input"
                    placeholder="e.g., Every Saturday at 10 AM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Founded Date</label>
                  <input
                    type="date"
                    value={formData.foundedDate}
                    onChange={(e) => setFormData({ ...formData, foundedDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Club
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Club Modal */}
      {editingClub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Edit Club</h2>
                <button onClick={() => setEditingClub(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Schedule</label>
                  <input
                    type="text"
                    value={formData.meetingSchedule}
                    onChange={(e) => setFormData({ ...formData, meetingSchedule: e.target.value })}
                    className="input"
                    placeholder="e.g., Every Saturday at 10 AM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Founded Date</label>
                  <input
                    type="date"
                    value={formData.foundedDate}
                    onChange={(e) => setFormData({ ...formData, foundedDate: e.target.value })}
                    className="input"
                  />
                </div>
                {isSystemAdmin && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Active
                    </label>
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setEditingClub(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Club
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Admins Modal */}
      {managingMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Manage Admins - {managingMembers.name}</h2>
                <button onClick={() => setManagingMembers(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Current Admins */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Current Admins</h3>
                {managingMembers.admins && managingMembers.admins.length > 0 ? (
                  <div className="space-y-2">
                    {managingMembers.admins.map((admin) => (
                      <div key={admin.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {admin.avatarUrl ? (
                            <img src={getAssetUrl(admin.avatarUrl)} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-purple-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{admin.userName}</p>
                            <p className="text-sm text-gray-500">{admin.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAdmin(managingMembers.clubId, admin.userId)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove Admin"
                        >
                          <ShieldOff className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No admins assigned yet</p>
                )}
              </div>

              {/* Add New Admin */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Add New Admin</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Note: User must be a club member before they can be assigned as admin.
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {getAvailableUsersForAdmin(managingMembers).map((u) => (
                    <div key={u.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">{u.firstName} {u.lastName}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignAdmin(managingMembers.clubId, u.userId)}
                        className="btn btn-sm btn-primary flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button onClick={() => setManagingMembers(null)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Avatar Modal */}
      {uploadingAvatar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Upload Club Avatar</h2>
                <button onClick={() => setUploadingAvatar(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center mb-4">
                {uploadingAvatar.avatarUrl ? (
                  <img
                    src={getAssetUrl(uploadingAvatar.avatarUrl)}
                    alt="Current avatar"
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold mx-auto mb-2">
                    {uploadingAvatar.name.charAt(0)}
                  </div>
                )}
                <p className="text-sm text-gray-500">Current avatar for {uploadingAvatar.name}</p>
              </div>

              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Click to select an image</p>
                <p className="text-xs text-gray-500">JPG, PNG, GIF, WEBP (max 5MB)</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>

              <div className="flex justify-end mt-4">
                <button onClick={() => setUploadingAvatar(null)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
