import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Calendar, Handshake, Megaphone, Tag, Check, X } from 'lucide-react';
import { eventTypesAPI } from '../../services/api';

// Icon mapping for display
const iconMap = {
  Calendar: Calendar,
  Handshake: Handshake,
  Megaphone: Megaphone,
  Tag: Tag,
};

// Color options
const colorOptions = [
  { value: 'primary', label: 'Primary', class: 'bg-primary text-white' },
  { value: 'accent', label: 'Accent', class: 'bg-accent text-white' },
  { value: 'info', label: 'Info', class: 'bg-blue-500 text-white' },
  { value: 'success', label: 'Success', class: 'bg-green-500 text-white' },
  { value: 'warning', label: 'Warning', class: 'bg-yellow-500 text-white' },
  { value: 'error', label: 'Error', class: 'bg-red-500 text-white' },
  { value: 'gray', label: 'Gray', class: 'bg-gray-500 text-white' },
];

// Icon options
const iconOptions = [
  { value: 'Calendar', label: 'Calendar', Icon: Calendar },
  { value: 'Handshake', label: 'Handshake', Icon: Handshake },
  { value: 'Megaphone', label: 'Megaphone', Icon: Megaphone },
  { value: 'Tag', label: 'Tag', Icon: Tag },
];

export default function EventTypes() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    displayName: '',
    description: '',
    icon: 'Calendar',
    color: 'primary',
    allowsRegistration: true,
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEventTypes();
  }, []);

  const loadEventTypes = async () => {
    try {
      const response = await eventTypesAPI.getAllAdmin();
      if (response.success) {
        setEventTypes(response.data);
      }
    } catch (err) {
      console.error('Failed to load event types:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingType(null);
    setFormData({
      code: '',
      displayName: '',
      description: '',
      icon: 'Calendar',
      color: 'primary',
      allowsRegistration: true,
      displayOrder: eventTypes.length,
    });
    setShowModal(true);
  };

  const openEditModal = (eventType) => {
    setEditingType(eventType);
    setFormData({
      code: eventType.code,
      displayName: eventType.displayName,
      description: eventType.description || '',
      icon: eventType.icon || 'Calendar',
      color: eventType.color || 'primary',
      allowsRegistration: eventType.allowsRegistration,
      displayOrder: eventType.displayOrder,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.displayName.trim()) {
      alert('Code and Display Name are required');
      return;
    }

    setSaving(true);
    try {
      if (editingType) {
        const response = await eventTypesAPI.update(editingType.eventTypeId, formData);
        if (response.success) {
          setEventTypes(eventTypes.map(et =>
            et.eventTypeId === editingType.eventTypeId ? response.data : et
          ));
          setShowModal(false);
        }
      } else {
        const response = await eventTypesAPI.create(formData);
        if (response.success) {
          setEventTypes([...eventTypes, response.data]);
          setShowModal(false);
        }
      }
    } catch (err) {
      alert('Failed to save: ' + (err.message || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventType) => {
    if (!confirm(`Delete event type "${eventType.displayName}"? If events exist using this type, it will be deactivated instead.`)) {
      return;
    }

    try {
      const response = await eventTypesAPI.delete(eventType.eventTypeId);
      if (response.success) {
        loadEventTypes(); // Reload to get updated state
      }
    } catch (err) {
      alert('Failed to delete: ' + (err.message || 'Please try again'));
    }
  };

  const toggleActive = async (eventType) => {
    try {
      const response = await eventTypesAPI.update(eventType.eventTypeId, {
        isActive: !eventType.isActive,
      });
      if (response.success) {
        setEventTypes(eventTypes.map(et =>
          et.eventTypeId === eventType.eventTypeId ? response.data : et
        ));
      }
    } catch (err) {
      alert('Failed to update: ' + (err.message || 'Please try again'));
    }
  };

  const getColorClass = (color) => {
    const colorOption = colorOptions.find(c => c.value === color);
    return colorOption?.class || 'bg-primary text-white';
  };

  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName] || Calendar;
    return <IconComponent className="w-5 h-5" />;
  };

  if (loading) {
    return <div className="text-center py-12">Loading event types...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Event Types</h1>
          <p className="text-gray-600 text-lg">Manage event type categories for your organization</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Event Type
        </button>
      </div>

      {/* Event Types List */}
      <div className="card">
        {eventTypes.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Event Types</h3>
            <p className="text-gray-500 mb-4">Create your first event type to categorize events</p>
            <button onClick={openAddModal} className="btn btn-primary">
              Add Event Type
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Order</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Registration</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {eventTypes.sort((a, b) => a.displayOrder - b.displayOrder).map((eventType) => (
                  <tr
                    key={eventType.eventTypeId}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${!eventType.isActive ? 'opacity-50' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <span className="text-gray-500 flex items-center gap-2">
                        <GripVertical className="w-4 h-4" />
                        {eventType.displayOrder}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className={`p-2 rounded-lg ${getColorClass(eventType.color)}`}>
                          {getIcon(eventType.icon)}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{eventType.displayName}</p>
                          {eventType.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">{eventType.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">{eventType.code}</code>
                    </td>
                    <td className="py-3 px-4">
                      {eventType.allowsRegistration ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                          <Check className="w-4 h-4" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                          <X className="w-4 h-4" /> No
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleActive(eventType)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          eventType.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {eventType.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(eventType)}
                          className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(eventType)}
                          className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingType ? 'Edit Event Type' : 'Add Event Type'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\s/g, '') })}
                  className="input w-full"
                  placeholder="e.g., CasecEvent, PartnerEvent"
                  disabled={!!editingType}
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier (no spaces). Cannot be changed after creation.</p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Community Event"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Brief description of this event type..."
                />
              </div>

              {/* Icon & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map(({ value, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: value })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.icon === value
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map(({ value, class: colorClass }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: value })}
                        className={`w-8 h-8 rounded-lg ${colorClass} ${
                          formData.color === value
                            ? 'ring-2 ring-offset-2 ring-gray-400'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Preview</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className={`p-2 rounded-lg ${getColorClass(formData.color)}`}>
                    {getIcon(formData.icon)}
                  </span>
                  <span className="font-medium">{formData.displayName || 'Event Type Name'}</span>
                </div>
              </div>

              {/* Allows Registration */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowsRegistration}
                    onChange={(e) => setFormData({ ...formData, allowsRegistration: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-semibold text-gray-700">Allows Registration</span>
                    <p className="text-sm text-gray-500">Users can register for events of this type</p>
                  </div>
                </label>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="input w-24"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : editingType ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
