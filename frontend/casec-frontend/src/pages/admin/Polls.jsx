import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, BarChart3, Eye, EyeOff, Users, Globe,
  Calendar, Star, StarOff, CheckCircle, Circle, MessageSquare, Hash
} from 'lucide-react';
import { pollsAPI } from '../../services/api';

const pollTypeOptions = [
  { value: 'SingleChoice', label: 'Single Choice', icon: Circle, description: 'Users select one option' },
  { value: 'MultipleChoice', label: 'Multiple Choice', icon: CheckCircle, description: 'Users select multiple options' },
  { value: 'Rating', label: 'Rating Scale', icon: Star, description: 'Users rate on a scale' },
  { value: 'Text', label: 'Text Response', icon: MessageSquare, description: 'Users provide text feedback' },
];

const visibilityOptions = [
  { value: 'Anyone', label: 'Anyone', icon: Globe, description: 'Visitors and members can vote' },
  { value: 'MembersOnly', label: 'Members Only', icon: Users, description: 'Only logged-in members can vote' },
];

const statusOptions = [
  { value: 'Draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { value: 'Active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'Closed', label: 'Closed', color: 'bg-red-100 text-red-700' },
];

export default function Polls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [editingPoll, setEditingPoll] = useState(null);
  const [viewingResults, setViewingResults] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    pollType: 'SingleChoice',
    visibility: 'Anyone',
    allowAnonymous: true,
    showResultsToVoters: true,
    allowChangeVote: false,
    maxSelections: 2,
    ratingMin: 1,
    ratingMax: 5,
    startDate: '',
    endDate: '',
    status: 'Draft',
    isFeatured: false,
    displayOrder: 0,
    options: ['', ''],
  });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const response = await pollsAPI.getAllAdmin();
      if (response.success) {
        setPolls(response.data);
      }
    } catch (err) {
      console.error('Failed to load polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPoll(null);
    setFormData({
      question: '',
      description: '',
      pollType: 'SingleChoice',
      visibility: 'Anyone',
      allowAnonymous: true,
      showResultsToVoters: true,
      allowChangeVote: false,
      maxSelections: 2,
      ratingMin: 1,
      ratingMax: 5,
      startDate: '',
      endDate: '',
      status: 'Draft',
      isFeatured: false,
      displayOrder: polls.length,
      options: ['', ''],
    });
    setShowModal(true);
  };

  const openEditModal = (poll) => {
    setEditingPoll(poll);
    setFormData({
      question: poll.question,
      description: poll.description || '',
      pollType: poll.pollType,
      visibility: poll.visibility,
      allowAnonymous: poll.allowAnonymous,
      showResultsToVoters: poll.showResultsToVoters,
      allowChangeVote: poll.allowChangeVote,
      maxSelections: poll.maxSelections || 2,
      ratingMin: poll.ratingMin || 1,
      ratingMax: poll.ratingMax || 5,
      startDate: poll.startDate ? poll.startDate.split('T')[0] : '',
      endDate: poll.endDate ? poll.endDate.split('T')[0] : '',
      status: poll.status,
      isFeatured: poll.isFeatured,
      displayOrder: poll.displayOrder,
      options: poll.options?.length > 0 ? poll.options.map(o => o.optionText) : ['', ''],
    });
    setShowModal(true);
  };

  const openResultsModal = async (poll) => {
    try {
      const response = await pollsAPI.getResults(poll.pollId);
      if (response.success) {
        setViewingResults(response.data);
        setShowResultsModal(true);
      }
    } catch (err) {
      console.error('Failed to load poll results:', err);
      alert('Failed to load poll results');
    }
  };

  const handleSave = async () => {
    if (!formData.question.trim()) {
      alert('Question is required');
      return;
    }

    // Validate options for choice-based polls
    if (['SingleChoice', 'MultipleChoice'].includes(formData.pollType)) {
      const validOptions = formData.options.filter(o => o.trim());
      if (validOptions.length < 2) {
        alert('Please provide at least 2 options');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        options: ['SingleChoice', 'MultipleChoice'].includes(formData.pollType)
          ? formData.options.filter(o => o.trim())
          : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      if (editingPoll) {
        const response = await pollsAPI.update(editingPoll.pollId, payload);
        if (response.success) {
          setPolls(polls.map(p => p.pollId === editingPoll.pollId ? response.data : p));
          setShowModal(false);
        }
      } else {
        const response = await pollsAPI.create(payload);
        if (response.success) {
          setPolls([response.data, ...polls]);
          setShowModal(false);
        }
      }
    } catch (err) {
      alert('Failed to save: ' + (err.message || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (poll) => {
    if (!confirm(`Delete poll "${poll.question}"? This will also delete all ${poll.totalResponses} responses.`)) {
      return;
    }

    try {
      const response = await pollsAPI.delete(poll.pollId);
      if (response.success) {
        setPolls(polls.filter(p => p.pollId !== poll.pollId));
      }
    } catch (err) {
      alert('Failed to delete: ' + (err.message || 'Please try again'));
    }
  };

  const toggleStatus = async (poll, newStatus) => {
    try {
      const response = await pollsAPI.update(poll.pollId, { status: newStatus });
      if (response.success) {
        setPolls(polls.map(p => p.pollId === poll.pollId ? response.data : p));
      }
    } catch (err) {
      alert('Failed to update status: ' + (err.message || 'Please try again'));
    }
  };

  const toggleFeatured = async (poll) => {
    try {
      const response = await pollsAPI.update(poll.pollId, { isFeatured: !poll.isFeatured });
      if (response.success) {
        setPolls(polls.map(p => p.pollId === poll.pollId ? response.data : p));
      }
    } catch (err) {
      alert('Failed to update: ' + (err.message || 'Please try again'));
    }
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) return;
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const filteredPolls = filterStatus === 'all'
    ? polls
    : polls.filter(p => p.status === filterStatus);

  const getStatusColor = (status) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-700';
  };

  const getPollTypeIcon = (type) => {
    const TypeIcon = pollTypeOptions.find(t => t.value === type)?.icon || Circle;
    return <TypeIcon className="w-4 h-4" />;
  };

  if (loading) {
    return <div className="text-center py-12">Loading polls...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Polls</h1>
          <p className="text-gray-600 text-lg">Create and manage polls to gather feedback</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Poll
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({polls.length})
        </button>
        {statusOptions.map(status => (
          <button
            key={status.value}
            onClick={() => setFilterStatus(status.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === status.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.label} ({polls.filter(p => p.status === status.value).length})
          </button>
        ))}
      </div>

      {/* Polls List */}
      <div className="space-y-4">
        {filteredPolls.length === 0 ? (
          <div className="card text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Polls</h3>
            <p className="text-gray-500 mb-4">Create your first poll to gather feedback</p>
            <button onClick={openAddModal} className="btn btn-primary">Create Poll</button>
          </div>
        ) : (
          filteredPolls.map(poll => (
            <div key={poll.pollId} className="card hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getPollTypeIcon(poll.pollType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900">{poll.question}</h3>
                        {poll.isFeatured && (
                          <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-semibold rounded">
                            Featured
                          </span>
                        )}
                      </div>
                      {poll.description && (
                        <p className="text-gray-600 text-sm mt-1">{poll.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded font-medium ${getStatusColor(poll.status)}`}>
                          {poll.status}
                        </span>
                        <span className="flex items-center gap-1">
                          {poll.visibility === 'Anyone' ? <Globe className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          {poll.visibility}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {poll.totalResponses} responses
                        </span>
                        {poll.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(poll.startDate).toLocaleDateString()}
                            {poll.endDate && ` - ${new Date(poll.endDate).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {poll.status === 'Draft' && (
                    <button
                      onClick={() => toggleStatus(poll, 'Active')}
                      className="btn btn-primary text-sm py-1"
                    >
                      Publish
                    </button>
                  )}
                  {poll.status === 'Active' && (
                    <button
                      onClick={() => toggleStatus(poll, 'Closed')}
                      className="btn btn-secondary text-sm py-1"
                    >
                      Close
                    </button>
                  )}
                  {poll.status === 'Closed' && (
                    <button
                      onClick={() => toggleStatus(poll, 'Active')}
                      className="btn btn-secondary text-sm py-1"
                    >
                      Reopen
                    </button>
                  )}
                  <button
                    onClick={() => toggleFeatured(poll)}
                    className={`p-2 rounded-lg transition-colors ${
                      poll.isFeatured
                        ? 'text-accent bg-accent/10 hover:bg-accent/20'
                        : 'text-gray-400 hover:text-accent hover:bg-accent/10'
                    }`}
                    title={poll.isFeatured ? 'Remove featured' : 'Set as featured'}
                  >
                    {poll.isFeatured ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => openResultsModal(poll)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View results"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(poll)}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(poll)}
                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Options Preview */}
              {['SingleChoice', 'MultipleChoice'].includes(poll.pollType) && poll.options?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {poll.options.map((option, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm"
                      >
                        <span className="text-gray-600">{option.optionText}</span>
                        <span className="text-xs text-gray-400">({option.voteCount || 0})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPoll ? 'Edit Poll' : 'Create Poll'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Question */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="input w-full"
                  placeholder="What would you like to ask?"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Optional context for the poll..."
                />
              </div>

              {/* Poll Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Poll Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {pollTypeOptions.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, pollType: type.value })}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                        formData.pollType === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className={`w-5 h-5 mt-0.5 ${formData.pollType === type.value ? 'text-primary' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium text-gray-900">{type.label}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options for Choice-based polls */}
              {['SingleChoice', 'MultipleChoice'].includes(formData.pollType) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Options</label>
                  <div className="space-y-2">
                    {formData.options.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm w-6">{idx + 1}.</span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          className="input flex-1"
                          placeholder={`Option ${idx + 1}`}
                        />
                        {formData.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add option
                    </button>
                  </div>
                </div>
              )}

              {/* Max selections for MultipleChoice */}
              {formData.pollType === 'MultipleChoice' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Selections (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.maxSelections || ''}
                    onChange={(e) => setFormData({ ...formData, maxSelections: e.target.value ? parseInt(e.target.value) : null })}
                    className="input w-32"
                    min="2"
                    placeholder="No limit"
                  />
                </div>
              )}

              {/* Rating scale settings */}
              {formData.pollType === 'Rating' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Min Rating</label>
                    <input
                      type="number"
                      value={formData.ratingMin}
                      onChange={(e) => setFormData({ ...formData, ratingMin: parseInt(e.target.value) || 1 })}
                      className="input w-full"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Rating</label>
                    <input
                      type="number"
                      value={formData.ratingMax}
                      onChange={(e) => setFormData({ ...formData, ratingMax: parseInt(e.target.value) || 5 })}
                      className="input w-full"
                      min="1"
                    />
                  </div>
                </div>
              )}

              {/* Visibility */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Who can respond?</label>
                <div className="grid grid-cols-2 gap-3">
                  {visibilityOptions.map(vis => (
                    <button
                      key={vis.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, visibility: vis.value })}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        formData.visibility === vis.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <vis.icon className={`w-5 h-5 ${formData.visibility === vis.value ? 'text-primary' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{vis.label}</p>
                        <p className="text-xs text-gray-500">{vis.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowAnonymous}
                    onChange={(e) => setFormData({ ...formData, allowAnonymous: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-gray-700">Allow anonymous responses</span>
                    <p className="text-sm text-gray-500">Members can choose to hide their identity</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showResultsToVoters}
                    onChange={(e) => setFormData({ ...formData, showResultsToVoters: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-gray-700">Show results to voters</span>
                    <p className="text-sm text-gray-500">Voters can see results after voting</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowChangeVote}
                    onChange={(e) => setFormData({ ...formData, allowChangeVote: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-gray-700">Allow changing vote</span>
                    <p className="text-sm text-gray-500">Voters can change their response</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-gray-700">Featured poll</span>
                    <p className="text-sm text-gray-500">Display prominently on homepage</p>
                  </div>
                </label>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date (optional)</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date (optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input w-full"
                >
                  {statusOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : editingPoll ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && viewingResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Poll Results</h2>
              <p className="text-gray-600 mt-1">{viewingResults.question}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {viewingResults.totalResponses} total responses
                </span>
                {viewingResults.averageRating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Average: {viewingResults.averageRating}
                  </span>
                )}
              </div>

              {/* Options results */}
              {viewingResults.options?.length > 0 && (
                <div className="space-y-3">
                  {viewingResults.options.map((option, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-900">{option.optionText}</span>
                        <span className="text-gray-600">{option.voteCount} ({option.percentage}%)</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${option.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Text responses */}
              {viewingResults.responses?.filter(r => r.textResponse).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Text Responses</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {viewingResults.responses.filter(r => r.textResponse).map((response, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{response.textResponse}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>
                            {response.isGuest ? 'Guest' : response.isAnonymous ? 'Anonymous Member' : response.userName || 'Member'}
                          </span>
                          <span>•</span>
                          <span>{new Date(response.respondedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent voters (non-anonymous) */}
              {viewingResults.responses?.filter(r => !r.isGuest && !r.isAnonymous && r.userName).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recent Voters</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {viewingResults.responses.filter(r => !r.isGuest && !r.isAnonymous && r.userName).slice(0, 10).map((response, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span className="text-gray-700">{response.userName}</span>
                        <span className="text-gray-500">{new Date(response.respondedAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button onClick={() => setShowResultsModal(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
