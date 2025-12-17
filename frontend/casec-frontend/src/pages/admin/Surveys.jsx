import { useState, useEffect } from 'react';
import { surveysAPI } from '../../services/api';
import { useTheme } from '../../components/ThemeProvider';
import {
  Plus,
  Edit2,
  Trash2,
  BarChart3,
  Eye,
  EyeOff,
  Star,
  StarOff,
  ClipboardList,
  GripVertical,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function AdminSurveys() {
  const { theme } = useTheme();
  const appName = theme?.organizationName || 'Community';

  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [surveyResults, setSurveyResults] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'Anyone',
    allowAnonymous: true,
    showResultsToRespondents: false,
    allowEditResponse: false,
    requireAllQuestions: false,
    showProgressBar: true,
    randomizeQuestions: false,
    oneResponsePerUser: true,
    startDate: '',
    endDate: '',
    status: 'Draft',
    isFeatured: false,
    thankYouMessage: 'Thank you for completing our survey!',
    redirectUrl: '',
    questions: [],
  });

  const questionTypes = [
    { value: 'SingleChoice', label: 'Single Choice' },
    { value: 'MultipleChoice', label: 'Multiple Choice' },
    { value: 'Rating', label: 'Rating Scale' },
    { value: 'Text', label: 'Short Text' },
    { value: 'TextArea', label: 'Long Text' },
    { value: 'Number', label: 'Number' },
    { value: 'Date', label: 'Date' },
    { value: 'Email', label: 'Email' },
    { value: 'Phone', label: 'Phone' },
  ];

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await surveysAPI.getAllAdmin();
      setSurveys(response.data || []);
    } catch (err) {
      setError('Failed to load surveys');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSurvey(null);
    setFormData({
      title: '',
      description: '',
      visibility: 'Anyone',
      allowAnonymous: true,
      showResultsToRespondents: false,
      allowEditResponse: false,
      requireAllQuestions: false,
      showProgressBar: true,
      randomizeQuestions: false,
      oneResponsePerUser: true,
      startDate: '',
      endDate: '',
      status: 'Draft',
      isFeatured: false,
      thankYouMessage: 'Thank you for completing our survey!',
      redirectUrl: '',
      questions: [createEmptyQuestion(0)],
    });
    setShowModal(true);
  };

  const handleEdit = async (survey) => {
    try {
      const response = await surveysAPI.getById(survey.surveyId);
      const surveyData = response.data;

      setEditingSurvey(surveyData);
      setFormData({
        title: surveyData.title || '',
        description: surveyData.description || '',
        visibility: surveyData.visibility || 'Anyone',
        allowAnonymous: surveyData.allowAnonymous ?? true,
        showResultsToRespondents: surveyData.showResultsToRespondents ?? false,
        allowEditResponse: surveyData.allowEditResponse ?? false,
        requireAllQuestions: surveyData.requireAllQuestions ?? false,
        showProgressBar: surveyData.showProgressBar ?? true,
        randomizeQuestions: surveyData.randomizeQuestions ?? false,
        oneResponsePerUser: surveyData.oneResponsePerUser ?? true,
        startDate: surveyData.startDate ? surveyData.startDate.split('T')[0] : '',
        endDate: surveyData.endDate ? surveyData.endDate.split('T')[0] : '',
        status: surveyData.status || 'Draft',
        isFeatured: surveyData.isFeatured ?? false,
        thankYouMessage: surveyData.thankYouMessage || 'Thank you for completing our survey!',
        redirectUrl: surveyData.redirectUrl || '',
        questions: surveyData.questions?.length > 0
          ? surveyData.questions.map((q, idx) => ({
              questionText: q.questionText || '',
              helpText: q.helpText || '',
              questionType: q.questionType || 'SingleChoice',
              isRequired: q.isRequired ?? false,
              options: q.options || [''],
              maxSelections: q.maxSelections || null,
              ratingMin: q.ratingMin ?? 1,
              ratingMax: q.ratingMax ?? 5,
              ratingMinLabel: q.ratingMinLabel || '',
              ratingMaxLabel: q.ratingMaxLabel || '',
              minLength: q.minLength || null,
              maxLength: q.maxLength || null,
              minValue: q.minValue || null,
              maxValue: q.maxValue || null,
              placeholder: q.placeholder || '',
              displayOrder: q.displayOrder ?? idx,
            }))
          : [createEmptyQuestion(0)],
      });
      setShowModal(true);
    } catch (err) {
      console.error('Failed to load survey details:', err);
      setError('Failed to load survey details');
    }
  };

  const createEmptyQuestion = (order) => ({
    questionText: '',
    helpText: '',
    questionType: 'SingleChoice',
    isRequired: false,
    options: [''],
    maxSelections: null,
    ratingMin: 1,
    ratingMax: 5,
    ratingMinLabel: '',
    ratingMaxLabel: '',
    minLength: null,
    maxLength: null,
    minValue: null,
    maxValue: null,
    placeholder: '',
    displayOrder: order,
  });

  const handleDelete = async (survey) => {
    if (!confirm(`Are you sure you want to delete "${survey.title}"? This will also delete all responses.`)) {
      return;
    }

    try {
      await surveysAPI.delete(survey.surveyId);
      fetchSurveys();
    } catch (err) {
      console.error('Failed to delete survey:', err);
      setError('Failed to delete survey');
    }
  };

  const handleViewResults = async (survey) => {
    try {
      const response = await surveysAPI.getResults(survey.surveyId);
      setSurveyResults(response.data);
      setShowResultsModal(true);
    } catch (err) {
      console.error('Failed to load results:', err);
      setError('Failed to load survey results');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.title.trim()) {
      setError('Survey title is required');
      return;
    }

    if (formData.questions.length === 0 || !formData.questions.some(q => q.questionText.trim())) {
      setError('At least one question is required');
      return;
    }

    const payload = {
      ...formData,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      questions: formData.questions
        .filter(q => q.questionText.trim())
        .map((q, idx) => ({
          questionText: q.questionText,
          helpText: q.helpText || null,
          questionType: q.questionType,
          isRequired: q.isRequired,
          options: ['SingleChoice', 'MultipleChoice'].includes(q.questionType)
            ? q.options.filter(o => o.trim())
            : null,
          maxSelections: q.questionType === 'MultipleChoice' ? q.maxSelections : null,
          ratingMin: q.questionType === 'Rating' ? q.ratingMin : null,
          ratingMax: q.questionType === 'Rating' ? q.ratingMax : null,
          ratingMinLabel: q.questionType === 'Rating' ? q.ratingMinLabel : null,
          ratingMaxLabel: q.questionType === 'Rating' ? q.ratingMaxLabel : null,
          minLength: ['Text', 'TextArea'].includes(q.questionType) ? q.minLength : null,
          maxLength: ['Text', 'TextArea'].includes(q.questionType) ? q.maxLength : null,
          minValue: q.questionType === 'Number' ? q.minValue : null,
          maxValue: q.questionType === 'Number' ? q.maxValue : null,
          placeholder: q.placeholder || null,
          displayOrder: idx,
        })),
    };

    try {
      if (editingSurvey) {
        await surveysAPI.update(editingSurvey.surveyId, payload);
      } else {
        await surveysAPI.create(payload);
      }
      setShowModal(false);
      fetchSurveys();
    } catch (err) {
      console.error('Failed to save survey:', err);
      setError('Failed to save survey');
    }
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion(prev.questions.length)],
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const addOption = (questionIndex) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, options: [...q.options, ''] } : q
      ),
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: q.options.filter((_, oi) => oi !== optionIndex) }
          : q
      ),
    }));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: q.options.map((o, oi) => (oi === optionIndex ? value : o)) }
          : q
      ),
    }));
  };

  const moveQuestion = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formData.questions.length) return;

    setFormData(prev => {
      const newQuestions = [...prev.questions];
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      return { ...prev, questions: newQuestions };
    });
  };

  const duplicateQuestion = (index) => {
    setFormData(prev => {
      const questionToDupe = { ...prev.questions[index], displayOrder: prev.questions.length };
      return { ...prev, questions: [...prev.questions, questionToDupe] };
    });
  };

  const filteredSurveys = surveys.filter(s => {
    if (statusFilter === 'all') return true;
    return s.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const getStatusBadge = (status) => {
    const colors = {
      Draft: 'bg-gray-100 text-gray-700',
      Active: 'bg-green-100 text-green-700',
      Closed: 'bg-red-100 text-red-700',
    };
    return colors[status] || colors.Draft;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
          <p className="text-gray-600">Create and manage multi-question surveys</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Survey
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {['all', 'Draft', 'Active', 'Closed'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Surveys List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredSurveys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No surveys found. Create your first survey!</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredSurveys.map(survey => (
              <div key={survey.surveyId} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{survey.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(survey.status)}`}>
                        {survey.status}
                      </span>
                      {survey.isFeatured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {survey.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{survey.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="w-4 h-4" />
                        {survey.questionCount} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {survey.responseCount} responses
                      </span>
                      <span className="flex items-center gap-1">
                        {survey.visibility === 'Anyone' ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                        {survey.visibility}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewResults(survey)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="View Results"
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(survey)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(survey)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">
                {editingSurvey ? 'Edit Survey' : 'Create Survey'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 border-b pb-2">Survey Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                    <select
                      value={formData.visibility}
                      onChange={e => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="Anyone">Anyone</option>
                      <option value="MembersOnly">Members Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={e => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowAnonymous}
                      onChange={e => setFormData(prev => ({ ...prev, allowAnonymous: e.target.checked }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Allow Anonymous</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requireAllQuestions}
                      onChange={e => setFormData(prev => ({ ...prev, requireAllQuestions: e.target.checked }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Require All Questions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showProgressBar}
                      onChange={e => setFormData(prev => ({ ...prev, showProgressBar: e.target.checked }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Show Progress Bar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.oneResponsePerUser}
                      onChange={e => setFormData(prev => ({ ...prev, oneResponsePerUser: e.target.checked }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">One Response Per User</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showResultsToRespondents}
                      onChange={e => setFormData(prev => ({ ...prev, showResultsToRespondents: e.target.checked }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Show Results to Users</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thank You Message</label>
                  <input
                    type="text"
                    value={formData.thankYouMessage}
                    onChange={e => setFormData(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-medium text-gray-900">Questions</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                {formData.questions.map((question, qIndex) => (
                  <div key={qIndex} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveQuestion(qIndex, -1)}
                          disabled={qIndex === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(qIndex, 1)}
                          disabled={qIndex === formData.questions.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-sm font-medium text-gray-500 mt-1">Q{qIndex + 1}</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={question.questionText}
                          onChange={e => updateQuestion(qIndex, 'questionText', e.target.value)}
                          placeholder="Enter your question..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateQuestion(qIndex)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="p-2 text-red-400 hover:text-red-600"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="ml-8 space-y-3">
                      <div className="flex gap-4 items-center">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                          <select
                            value={question.questionType}
                            onChange={e => updateQuestion(qIndex, 'questionType', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                          >
                            {questionTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer pt-5">
                          <input
                            type="checkbox"
                            checked={question.isRequired}
                            onChange={e => updateQuestion(qIndex, 'isRequired', e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm">Required</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Help Text (optional)</label>
                        <input
                          type="text"
                          value={question.helpText}
                          onChange={e => updateQuestion(qIndex, 'helpText', e.target.value)}
                          placeholder="Additional instructions..."
                          className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>

                      {/* Type-specific options */}
                      {['SingleChoice', 'MultipleChoice'].includes(question.questionType) && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Options</label>
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={option}
                                onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                placeholder={`Option ${oIndex + 1}`}
                                className="flex-1 px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                              />
                              {question.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(qIndex, oIndex)}
                                  className="p-1.5 text-red-400 hover:text-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            className="text-sm text-primary hover:text-primary-dark"
                          >
                            + Add Option
                          </button>
                          {question.questionType === 'MultipleChoice' && (
                            <div className="mt-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Max Selections</label>
                              <input
                                type="number"
                                value={question.maxSelections || ''}
                                onChange={e => updateQuestion(qIndex, 'maxSelections', e.target.value ? parseInt(e.target.value) : null)}
                                min="1"
                                placeholder="No limit"
                                className="w-24 px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {question.questionType === 'Rating' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Min Value</label>
                            <input
                              type="number"
                              value={question.ratingMin}
                              onChange={e => updateQuestion(qIndex, 'ratingMin', parseInt(e.target.value))}
                              className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Max Value</label>
                            <input
                              type="number"
                              value={question.ratingMax}
                              onChange={e => updateQuestion(qIndex, 'ratingMax', parseInt(e.target.value))}
                              className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Min Label</label>
                            <input
                              type="text"
                              value={question.ratingMinLabel}
                              onChange={e => updateQuestion(qIndex, 'ratingMinLabel', e.target.value)}
                              placeholder="e.g., Poor"
                              className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Max Label</label>
                            <input
                              type="text"
                              value={question.ratingMaxLabel}
                              onChange={e => updateQuestion(qIndex, 'ratingMaxLabel', e.target.value)}
                              placeholder="e.g., Excellent"
                              className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                        </div>
                      )}

                      {['Text', 'TextArea', 'Email', 'Phone'].includes(question.questionType) && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
                          <input
                            type="text"
                            value={question.placeholder}
                            onChange={e => updateQuestion(qIndex, 'placeholder', e.target.value)}
                            placeholder="Placeholder text..."
                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </form>

            <div className="flex justify-end gap-3 p-4 border-t sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                {editingSurvey ? 'Update Survey' : 'Create Survey'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && surveyResults && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-semibold">{surveyResults.title}</h2>
                <p className="text-sm text-gray-500">
                  {surveyResults.completedResponses} completed / {surveyResults.totalResponses} total responses
                </p>
              </div>
              <button onClick={() => setShowResultsModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {surveyResults.questionResults.map((qr, index) => (
                <div key={qr.questionId} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-1">
                    Q{index + 1}. {qr.questionText}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{qr.responseCount} responses</p>

                  {['SingleChoice', 'MultipleChoice'].includes(qr.questionType) && qr.optionResults && (
                    <div className="space-y-2">
                      {qr.optionResults.map((opt, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{opt.option}</span>
                            <span className="text-gray-500">{opt.count} ({opt.percentage}%)</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {qr.questionType === 'Rating' && (
                    <div>
                      {qr.averageRating !== null && (
                        <p className="text-2xl font-bold text-primary mb-3">
                          Average: {qr.averageRating}
                        </p>
                      )}
                      {qr.optionResults && (
                        <div className="space-y-2">
                          {qr.optionResults.map((opt, i) => (
                            <div key={i}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{opt.option} stars</span>
                                <span className="text-gray-500">{opt.count} ({opt.percentage}%)</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-400 rounded-full transition-all"
                                  style={{ width: `${opt.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {['Text', 'TextArea'].includes(qr.questionType) && qr.textResponses && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {qr.textResponses.length === 0 ? (
                        <p className="text-gray-500 italic">No responses yet</p>
                      ) : (
                        qr.textResponses.map((text, i) => (
                          <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                            {text}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {qr.questionType === 'Number' && qr.averageNumber !== null && (
                    <p className="text-2xl font-bold text-primary">
                      Average: {qr.averageNumber}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setShowResultsModal(false)}
                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
