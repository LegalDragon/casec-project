import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Upload, CheckCircle, AlertCircle, Calendar,
  DollarSign, ArrowRight, Clock, PartyPopper
} from 'lucide-react';
import { membershipPaymentsAPI, membershipTypesAPI, getAssetUrl } from '../services/api';
import { useAuthStore } from '../store/useStore';
import { useTheme } from '../components/ThemeProvider';

export default function Payment() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const appName = theme?.organizationName || 'our community';
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [durations, setDurations] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    membershipTypeId: '',
    durationId: '',
    amount: '',
    paymentMethod: 'Zelle',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentScope: 'Self',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Pre-select user's membership type
    if (user?.membershipTypeId && membershipTypes.length > 0) {
      const type = membershipTypes.find(t => t.membershipTypeId === user.membershipTypeId);
      if (type) {
        setFormData(prev => ({
          ...prev,
          membershipTypeId: type.membershipTypeId.toString(),
          amount: type.annualFee?.toString() || ''
        }));
      }
    }
  }, [user, membershipTypes]);

  const loadData = async () => {
    try {
      const [typesRes, durationsRes, methodsRes] = await Promise.all([
        membershipTypesAPI.getAll(),
        membershipPaymentsAPI.getDurations(),
        membershipPaymentsAPI.getMethods()
      ]);

      if (typesRes.success) setMembershipTypes(typesRes.data);
      if (durationsRes.success) {
        setDurations(durationsRes.data);
        // Pre-select first duration (usually 1 year)
        if (durationsRes.data.length > 0) {
          setFormData(prev => ({ ...prev, durationId: durationsRes.data[0].durationId.toString() }));
        }
      }
      if (methodsRes.success) setPaymentMethods(methodsRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await membershipPaymentsAPI.submit({
        ...formData,
        membershipTypeId: parseInt(formData.membershipTypeId),
        durationId: parseInt(formData.durationId),
        amount: parseFloat(formData.amount)
      });

      if (response.success) {
        setPaymentSubmitted(response.data);
      }
    } catch (err) {
      alert('Failed to submit payment: ' + (err.message || 'Please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadProof = async (file) => {
    if (!paymentSubmitted?.paymentId) return;

    setUploading(true);
    try {
      const response = await membershipPaymentsAPI.uploadProof(paymentSubmitted.paymentId, file);
      if (response.success) {
        alert('Payment proof uploaded successfully! Your membership will be activated once the payment is verified.');
        navigate('/dashboard');
      }
    } catch (err) {
      alert('Failed to upload proof: ' + (err.message || 'Please try again'));
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const selectedType = membershipTypes.find(t => t.membershipTypeId === parseInt(formData.membershipTypeId));
  const selectedDuration = durations.find(d => d.durationId === parseInt(formData.durationId));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Payment submitted - show proof upload
  if (paymentSubmitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Payment Submitted!</h1>
          <p className="text-gray-600">Please upload your proof of payment to complete the process.</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-primary" />
            Upload Proof of Payment
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Please upload a screenshot or photo of your payment confirmation.
              This helps us verify your payment quickly.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-semibold">${formData.amount}</p>
              </div>
              <div>
                <p className="text-gray-500">Method</p>
                <p className="font-semibold">{formData.paymentMethod}</p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUploadProof(e.target.files[0]);
                }
              }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-primary w-full flex items-center justify-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Proof of Payment'}
            </button>

            <button
              onClick={handleSkip}
              className="btn btn-secondary w-full"
            >
              Upload Later
            </button>

            <p className="text-sm text-gray-500 text-center">
              You can also upload the proof later from the Membership page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-full mb-4">
          <PartyPopper className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Welcome to {user?.firstName ? `${user.firstName}!` : `${appName}!`}
        </h1>
        <p className="text-gray-600 text-lg">
          Complete your membership payment to activate all features.
        </p>
      </div>

      {/* Skip Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-900 font-medium">Payment is optional right now</p>
          <p className="text-blue-700 text-sm mt-1">
            You can skip this step and complete your payment later from the{' '}
            <span className="font-semibold">Membership</span> page. Your account is already active!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-primary" />
            Submit Membership Payment
          </h2>

          {/* Payment Instructions */}
          {paymentMethods.map((method) => (
            <div key={method.code} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{method.name} Payment Instructions</h3>
              <p className="text-sm text-gray-700">{method.instructions}</p>
            </div>
          ))}

          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Membership Type
                </label>
                <select
                  className="input w-full"
                  value={formData.membershipTypeId}
                  onChange={(e) => {
                    const type = membershipTypes.find(t => t.membershipTypeId === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      membershipTypeId: e.target.value,
                      amount: type?.annualFee?.toString() || ''
                    });
                  }}
                  required
                >
                  <option value="">Select membership type</option>
                  {membershipTypes.map((type) => (
                    <option key={type.membershipTypeId} value={type.membershipTypeId}>
                      {type.name} - ${type.annualFee}/year
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Membership Duration
                </label>
                <select
                  className="input w-full"
                  value={formData.durationId}
                  onChange={(e) => setFormData({ ...formData, durationId: e.target.value })}
                  required
                >
                  <option value="">Select duration</option>
                  {durations.map((duration) => (
                    <option key={duration.durationId} value={duration.durationId}>
                      {duration.name} ({duration.months} months)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount Paid ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input w-full"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  className="input w-full"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  {paymentMethods.map((method) => (
                    <option key={method.code} value={method.code}>{method.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  className="input w-full"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transaction ID (optional)
                </label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  placeholder="Confirmation number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                className="input w-full"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex-1 flex items-center justify-center"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Payment'}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="btn btn-secondary flex items-center justify-center"
              >
                Skip for Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </form>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="card bg-gradient-to-br from-primary to-primary-dark text-white">
            <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div>
                <p className="text-white/70 text-sm">Membership Type</p>
                <p className="font-semibold">{selectedType?.name || 'Not selected'}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Duration</p>
                <p className="font-semibold">{selectedDuration?.name || 'Not selected'}</p>
              </div>
              <div className="pt-3 border-t border-white/20">
                <p className="text-white/70 text-sm">Total Amount</p>
                <p className="text-3xl font-bold">
                  ${formData.amount || '0'}
                </p>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">What's Included</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Full access to all platform features</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Join unlimited clubs</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Priority event registration</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Member directory access</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Exclusive newsletters & updates</span>
              </li>
            </ul>
          </div>

          {/* Process Info */}
          <div className="card bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              How it works
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">1</span>
                <span>Submit your payment details</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">2</span>
                <span>Upload proof of payment</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">3</span>
                <span>Admin verifies and activates</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
