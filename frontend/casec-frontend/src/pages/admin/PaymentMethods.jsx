import { useState, useEffect } from 'react';
import {
  CreditCard, Plus, Edit2, Trash2, GripVertical,
  Check, X, AlertCircle
} from 'lucide-react';
import { membershipPaymentsAPI } from '../../services/api';

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    instructions: '',
    icon: '',
    isActive: true,
    displayOrder: 0
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      const response = await membershipPaymentsAPI.getAllMethods();
      if (response.success) {
        setMethods(response.data);
      }
    } catch (err) {
      console.error('Failed to load payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      code: '',
      name: '',
      instructions: '',
      icon: '',
      isActive: true,
      displayOrder: methods.length
    });
    setShowForm(true);
  };

  const handleEdit = (method) => {
    setEditingId(method.paymentMethodId);
    setFormData({
      code: method.code,
      name: method.name,
      instructions: method.instructions || '',
      icon: method.icon || '',
      isActive: method.isActive,
      displayOrder: method.displayOrder
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      code: '',
      name: '',
      instructions: '',
      icon: '',
      isActive: true,
      displayOrder: 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let response;
      if (editingId) {
        response = await membershipPaymentsAPI.updateMethod(editingId, formData);
      } else {
        response = await membershipPaymentsAPI.createMethod(formData);
      }

      if (response.success) {
        handleCancel();
        loadMethods();
      } else {
        alert(response.message || 'Failed to save payment method');
      }
    } catch (err) {
      alert('Error saving payment method: ' + (err.message || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (method) => {
    if (!confirm(`Are you sure you want to delete "${method.name}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(method.paymentMethodId);
    try {
      const response = await membershipPaymentsAPI.deleteMethod(method.paymentMethodId);
      if (response.success) {
        loadMethods();
      } else {
        alert(response.message || 'Failed to delete payment method');
      }
    } catch (err) {
      alert('Error deleting payment method: ' + (err.message || 'Please try again'));
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (method) => {
    try {
      const response = await membershipPaymentsAPI.updateMethod(method.paymentMethodId, {
        ...method,
        isActive: !method.isActive
      });
      if (response.success) {
        loadMethods();
      }
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600">Configure available payment methods and instructions</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Payment Method
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingId ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., Zelle"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Internal identifier (no spaces)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Zelle Transfer"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Instructions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input w-full"
                    rows={4}
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Enter detailed payment instructions that will be shown to members..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include recipient info, what to put in memo, etc.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon (optional)
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="e.g., CreditCard"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lucide icon name</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      className="input w-full"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      min={0}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active (visible to members)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Method'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Methods List */}
      {methods.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No payment methods configured yet</p>
          <button onClick={handleAdd} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Add Your First Payment Method
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {methods.map((method) => (
            <div
              key={method.paymentMethodId}
              className={`card ${!method.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{method.code}</code>
                      {method.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="mt-2 bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{method.instructions}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Display Order: {method.displayOrder}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(method)}
                    className={`p-2 rounded-lg transition-colors ${
                      method.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={method.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {method.isActive ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleEdit(method)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(method)}
                    disabled={deleting === method.paymentMethodId}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === method.paymentMethodId ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-900 font-medium">Payment Instructions</p>
          <p className="text-blue-700 text-sm mt-1">
            These instructions are displayed to members on the payment screen. Make sure to include
            recipient details (email, phone number for Zelle, address for checks, etc.) and what
            members should put in the memo/description.
          </p>
        </div>
      </div>
    </div>
  );
}
