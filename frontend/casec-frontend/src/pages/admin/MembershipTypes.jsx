import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Save, X, Users, DollarSign, Award,
  Shield, Calendar, ChevronUp, ChevronDown, Check, XCircle, Clock
} from 'lucide-react';
import api, { membershipDurationsAPI } from '../../services/api';

export default function MembershipTypes() {
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [durations, setDurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    annualFee: 0,
    maxFamilyMembers: 1,
    canManageClubs: false,
    canManageEvents: false,
    hasBoardVotingRights: false,
    displayOrder: 0,
    icon: '',
    isActive: true,
  });

  // Duration management state
  const [editingDurationId, setEditingDurationId] = useState(null);
  const [showCreateDurationModal, setShowCreateDurationModal] = useState(false);
  const [durationFormData, setDurationFormData] = useState({
    name: '',
    months: 12,
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typesRes, durationsRes] = await Promise.all([
        api.get('/membershiptypes?includeInactive=true'),
        membershipDurationsAPI.getAllAdmin()
      ]);
      if (typesRes.success) setMembershipTypes(typesRes.data);
      if (durationsRes.success) setDurations(durationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembershipTypes = async () => {
    try {
      const response = await api.get('/membershiptypes?includeInactive=true');
      if (response.success) {
        setMembershipTypes(response.data);
      }
    } catch (error) {
      console.error('Error fetching membership types:', error);
      alert('Failed to load membership types');
    }
  };

  const fetchDurations = async () => {
    try {
      const response = await membershipDurationsAPI.getAllAdmin();
      if (response.success) {
        setDurations(response.data);
      }
    } catch (error) {
      console.error('Error fetching durations:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/membershiptypes', formData);
      if (response.success) {
        alert('Membership type created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchMembershipTypes();
      }
    } catch (error) {
      console.error('Error creating membership type:', error);
      alert(error.message || 'Failed to create membership type');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/membershiptypes/${editingId}`, formData);
      if (response.success) {
        alert('Membership type updated successfully!');
        setEditingId(null);
        resetForm();
        fetchMembershipTypes();
      }
    } catch (error) {
      console.error('Error updating membership type:', error);
      alert(error.message || 'Failed to update membership type');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.delete(`/membershiptypes/${id}`);
      if (response.success) {
        alert('Membership type deleted successfully!');
        fetchMembershipTypes();
      }
    } catch (error) {
      console.error('Error deleting membership type:', error);
      alert(error.message || 'Failed to delete membership type');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/membershiptypes/${id}`, { isActive: !currentStatus });
      fetchMembershipTypes();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const startEdit = (type) => {
    setEditingId(type.membershipTypeId);
    setFormData({
      name: type.name,
      description: type.description || '',
      annualFee: type.annualFee,
      maxFamilyMembers: type.maxFamilyMembers,
      canManageClubs: type.canManageClubs,
      canManageEvents: type.canManageEvents,
      hasBoardVotingRights: type.hasBoardVotingRights,
      displayOrder: type.displayOrder,
      icon: type.icon || '',
      isActive: type.isActive,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      annualFee: 0,
      maxFamilyMembers: 1,
      canManageClubs: false,
      canManageEvents: false,
      hasBoardVotingRights: false,
      displayOrder: 0,
      icon: '',
      isActive: true,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  // Duration CRUD functions
  const handleCreateDuration = async (e) => {
    e.preventDefault();
    try {
      const response = await membershipDurationsAPI.create(durationFormData);
      if (response.success) {
        alert('Duration created successfully!');
        setShowCreateDurationModal(false);
        resetDurationForm();
        fetchDurations();
      }
    } catch (error) {
      console.error('Error creating duration:', error);
      alert(error.message || 'Failed to create duration');
    }
  };

  const handleUpdateDuration = async (e) => {
    e.preventDefault();
    try {
      const response = await membershipDurationsAPI.update(editingDurationId, durationFormData);
      if (response.success) {
        alert('Duration updated successfully!');
        setEditingDurationId(null);
        resetDurationForm();
        fetchDurations();
      }
    } catch (error) {
      console.error('Error updating duration:', error);
      alert(error.message || 'Failed to update duration');
    }
  };

  const handleDeleteDuration = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    try {
      const response = await membershipDurationsAPI.delete(id);
      if (response.success) {
        alert(response.message || 'Duration deleted successfully!');
        fetchDurations();
      }
    } catch (error) {
      console.error('Error deleting duration:', error);
      alert(error.message || 'Failed to delete duration');
    }
  };

  const startEditDuration = (duration) => {
    setEditingDurationId(duration.durationId);
    setDurationFormData({
      name: duration.name,
      months: duration.months,
      description: duration.description || '',
      displayOrder: duration.displayOrder,
      isActive: duration.isActive,
    });
  };

  const resetDurationForm = () => {
    setDurationFormData({
      name: '',
      months: 12,
      description: '',
      displayOrder: 0,
      isActive: true,
    });
  };

  const cancelEditDuration = () => {
    setEditingDurationId(null);
    resetDurationForm();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Membership Types</h1>
          <p className="text-gray-600 mt-1">Configure membership tiers and their benefits</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Membership Type
        </button>
      </div>

      {/* Membership Types List */}
      <div className="space-y-4">
        {membershipTypes.map((type) => (
          <div
            key={type.membershipTypeId}
            className={`card ${!type.isActive ? 'opacity-60 bg-gray-50' : ''}`}
          >
            {editingId === type.membershipTypeId ? (
              /* Edit Mode */
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Annual Fee ($)</label>
                    <input
                      type="number"
                      value={formData.annualFee}
                      onChange={(e) => setFormData({ ...formData, annualFee: parseFloat(e.target.value) || 0 })}
                      className="input w-full"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Family Members</label>
                    <input
                      type="number"
                      value={formData.maxFamilyMembers}
                      onChange={(e) => setFormData({ ...formData, maxFamilyMembers: parseInt(e.target.value) || 1 })}
                      className="input w-full"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="input w-full"
                      placeholder="e.g., 🌟"
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input w-full"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div className="flex flex-wrap gap-6 pt-4 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canManageClubs}
                      onChange={(e) => setFormData({ ...formData, canManageClubs: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Can Manage Clubs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canManageEvents}
                      onChange={(e) => setFormData({ ...formData, canManageEvents: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Can Manage Events</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasBoardVotingRights}
                      onChange={(e) => setFormData({ ...formData, hasBoardVotingRights: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Has Board Voting Rights</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button type="button" onClick={cancelEdit} className="btn btn-secondary flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{type.icon || '📋'}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">{type.name}</h3>
                      {!type.isActive && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    {type.description && (
                      <p className="text-gray-600 text-sm mt-1">{type.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">${type.annualFee}</span>
                        <span>/year</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Up to {type.maxFamilyMembers} family members</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <ChevronUp className="w-4 h-4" />
                        <span>Order: {type.displayOrder}</span>
                      </div>
                    </div>
                    {/* Permissions badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {type.canManageClubs && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Manage Clubs
                        </span>
                      )}
                      {type.canManageEvents && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Manage Events
                        </span>
                      )}
                      {type.hasBoardVotingRights && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Award className="w-3 h-3" /> Board Voting
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleToggleActive(type.membershipTypeId, type.isActive)}
                    className={`p-2 rounded ${type.isActive ? 'text-orange-600 hover:bg-orange-100' : 'text-green-600 hover:bg-green-100'}`}
                    title={type.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {type.isActive ? <XCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => startEdit(type)}
                    className="p-2 text-primary hover:bg-primary/10 rounded"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(type.membershipTypeId, type.name)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {membershipTypes.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">No Membership Types</h3>
          <p className="text-gray-500 mb-4">Create your first membership type to get started.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            Create Membership Type
          </button>
        </div>
      )}

      {/* Membership Durations Section */}
      <div className="mt-12 pt-8 border-t">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Membership Durations</h2>
            <p className="text-gray-600 mt-1">Configure available membership duration options (e.g., yearly periods)</p>
          </div>
          <button
            onClick={() => setShowCreateDurationModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Duration
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {durations.map((duration) => (
            <div
              key={duration.durationId}
              className={`card ${!duration.isActive ? 'opacity-60 bg-gray-50' : ''}`}
            >
              {editingDurationId === duration.durationId ? (
                /* Edit Duration Mode */
                <form onSubmit={handleUpdateDuration} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={durationFormData.name}
                      onChange={(e) => setDurationFormData({ ...durationFormData, name: e.target.value })}
                      className="input w-full"
                      required
                      placeholder="e.g., 2025 Membership"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Months</label>
                    <input
                      type="number"
                      value={durationFormData.months}
                      onChange={(e) => setDurationFormData({ ...durationFormData, months: parseInt(e.target.value) || 12 })}
                      className="input w-full"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={durationFormData.description}
                      onChange={(e) => setDurationFormData({ ...durationFormData, description: e.target.value })}
                      className="input w-full"
                      placeholder="e.g., Jan 2025 - Dec 2025"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                      <input
                        type="number"
                        value={durationFormData.displayOrder}
                        onChange={(e) => setDurationFormData({ ...durationFormData, displayOrder: parseInt(e.target.value) || 0 })}
                        className="input w-full"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={durationFormData.isActive}
                          onChange={(e) => setDurationFormData({ ...durationFormData, isActive: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={cancelEditDuration} className="btn btn-secondary text-sm">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary text-sm">
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                /* View Duration Mode */
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{duration.name}</h3>
                          {!duration.isActive && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{duration.months} months</p>
                      </div>
                    </div>
                  </div>
                  {duration.description && (
                    <p className="text-sm text-gray-500 mt-2">{duration.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <span className="text-xs text-gray-400">Order: {duration.displayOrder}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditDuration(duration)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDuration(duration.durationId, duration.name)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {durations.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No Durations Configured</h3>
            <p className="text-gray-500 text-sm mb-3">Create durations for each membership year</p>
            <button
              onClick={() => setShowCreateDurationModal(true)}
              className="btn btn-primary text-sm"
            >
              Add Duration
            </button>
          </div>
        )}
      </div>

      {/* Create Duration Modal */}
      {showCreateDurationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Membership Duration</h2>
              <form onSubmit={handleCreateDuration} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={durationFormData.name}
                    onChange={(e) => setDurationFormData({ ...durationFormData, name: e.target.value })}
                    className="input w-full"
                    required
                    placeholder="e.g., 2025 Membership"
                  />
                  <p className="text-xs text-gray-500 mt-1">Name the duration period (e.g., year or season)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months) *</label>
                  <input
                    type="number"
                    value={durationFormData.months}
                    onChange={(e) => setDurationFormData({ ...durationFormData, months: parseInt(e.target.value) || 12 })}
                    className="input w-full"
                    min="1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">How many months the membership lasts</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={durationFormData.description}
                    onChange={(e) => setDurationFormData({ ...durationFormData, description: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., January 2025 - December 2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={durationFormData.displayOrder}
                    onChange={(e) => setDurationFormData({ ...durationFormData, displayOrder: parseInt(e.target.value) || 0 })}
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateDurationModal(false);
                      resetDurationForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Duration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Membership Type</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input w-full"
                      required
                      placeholder="e.g., Premium Member"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Annual Fee ($)</label>
                    <input
                      type="number"
                      value={formData.annualFee}
                      onChange={(e) => setFormData({ ...formData, annualFee: parseFloat(e.target.value) || 0 })}
                      className="input w-full"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Family Members</label>
                    <input
                      type="number"
                      value={formData.maxFamilyMembers}
                      onChange={(e) => setFormData({ ...formData, maxFamilyMembers: parseInt(e.target.value) || 1 })}
                      className="input w-full"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="input w-full"
                      placeholder="e.g., 🌟"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input w-full"
                      rows={3}
                      placeholder="Describe the benefits of this membership type..."
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Permissions</h3>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.canManageClubs}
                        onChange={(e) => setFormData({ ...formData, canManageClubs: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Can Manage Clubs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.canManageEvents}
                        onChange={(e) => setFormData({ ...formData, canManageEvents: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Can Manage Events</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasBoardVotingRights}
                        onChange={(e) => setFormData({ ...formData, hasBoardVotingRights: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Has Board Voting Rights</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Membership Type
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
