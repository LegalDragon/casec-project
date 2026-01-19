import { useState, useEffect, useRef } from 'react';
import {
  CreditCard, Upload, Clock, CheckCircle, XCircle, AlertCircle,
  Calendar, DollarSign, Users, FileText, Trash2, Eye
} from 'lucide-react';
import { membershipPaymentsAPI, membershipTypesAPI, getAssetUrl } from '../services/api';
import { useAuthStore } from '../store/useStore';

export default function Membership() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState(null);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [durations, setDurations] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
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

  const loadData = async () => {
    try {
      const [statusRes, typesRes, durationsRes, methodsRes] = await Promise.all([
        membershipPaymentsAPI.getStatus(),
        membershipTypesAPI.getAll(),
        membershipPaymentsAPI.getDurations(),
        membershipPaymentsAPI.getMethods()
      ]);

      if (statusRes.success) setStatus(statusRes.data);
      if (typesRes.success) setMembershipTypes(typesRes.data);
      if (durationsRes.success) setDurations(durationsRes.data);
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
        alert('Payment submitted successfully! Please upload proof of payment.');
        setShowPaymentForm(false);
        loadData();
      }
    } catch (err) {
      alert('Failed to submit payment: ' + (err.message || 'Please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadProof = async (paymentId, file) => {
    setUploading(true);
    try {
      const response = await membershipPaymentsAPI.uploadProof(paymentId, file);
      if (response.success) {
        alert('Proof uploaded successfully!');
        loadData();
      }
    } catch (err) {
      alert('Failed to upload proof: ' + (err.message || 'Please try again'));
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPayment = async (paymentId) => {
    if (!confirm('Are you sure you want to cancel this payment?')) return;

    try {
      const response = await membershipPaymentsAPI.cancel(paymentId);
      if (response.success) {
        alert('Payment cancelled');
        loadData();
      }
    } catch (err) {
      alert('Failed to cancel payment: ' + (err.message || 'Please try again'));
    }
  };

  const getStatusBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'Pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" /> Pending
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" /> Confirmed
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Membership</h1>
        <p className="text-gray-600 text-lg">Manage your membership and payments</p>
      </div>

      {/* Membership Status Card */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-primary" />
          Current Membership Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Membership Type</p>
            <p className="text-lg font-semibold text-gray-900">{status?.membershipTypeName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Annual Fee</p>
            <p className="text-lg font-semibold text-primary">${status?.membershipPrice || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Valid Until</p>
            <p className={`text-lg font-semibold ${status?.isExpired ? 'text-red-600' : status?.isExpiringSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
              {status?.membershipValidUntil ? formatDate(status.membershipValidUntil) : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            {status?.isExpired ? (
              <span className="inline-flex items-center text-red-600 font-semibold">
                <XCircle className="w-5 h-5 mr-1" /> Expired
              </span>
            ) : status?.isExpiringSoon ? (
              <span className="inline-flex items-center text-yellow-600 font-semibold">
                <AlertCircle className="w-5 h-5 mr-1" /> Expiring in {status.daysUntilExpiration} days
              </span>
            ) : (
              <span className="inline-flex items-center text-green-600 font-semibold">
                <CheckCircle className="w-5 h-5 mr-1" /> Active
              </span>
            )}
          </div>
        </div>

        {/* Family Members */}
        {status?.familyMembers && status.familyMembers.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" /> Family Members
            </h3>
            <div className="flex flex-wrap gap-3">
              {status.familyMembers.map((member) => (
                <div key={member.userId} className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                  {member.avatarUrl ? (
                    <img src={getAssetUrl(member.avatarUrl)} alt={member.firstName} className="w-8 h-8 rounded-full mr-2" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2 text-primary font-bold text-sm">
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{member.firstName} {member.lastName}</p>
                    {member.relationship && (
                      <p className="text-xs text-gray-500">{member.relationship}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pending Payment */}
      {status?.pendingPayment && (
        <div className="card border-yellow-300 bg-yellow-50">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-yellow-600" />
            Pending Payment
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-semibold">${status.pendingPayment.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-semibold">{status.pendingPayment.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="font-semibold">{formatDate(status.pendingPayment.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                {getStatusBadge(status.pendingPayment.status)}
              </div>
            </div>

            {/* Proof of Payment */}
            <div className="flex items-center justify-between pt-4 border-t border-yellow-200">
              {status.pendingPayment.proofOfPaymentUrl ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Proof uploaded</span>
                  <a
                    href={getAssetUrl(status.pendingPayment.proofOfPaymentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary hover:underline text-sm flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" /> View
                  </a>
                </div>
              ) : (
                <div className="flex items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleUploadProof(status.pendingPayment.paymentId, e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn btn-primary flex items-center text-sm"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {uploading ? 'Uploading...' : 'Upload Proof'}
                  </button>
                </div>
              )}

              <button
                onClick={() => handleCancelPayment(status.pendingPayment.paymentId)}
                className="btn btn-secondary text-red-600 hover:bg-red-50 flex items-center text-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit New Payment */}
      {!status?.pendingPayment && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-primary" />
              {status?.isExpired || status?.isExpiringSoon ? 'Renew Membership' : 'Submit Payment'}
            </h2>
            {!showPaymentForm && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="btn btn-primary"
              >
                {status?.isExpired ? 'Renew Now' : 'New Payment'}
              </button>
            )}
          </div>

          {showPaymentForm && (
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Payment Instructions */}
              {paymentMethods.map((method) => (
                <div key={method.code} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">{method.name} Payment Instructions</h3>
                  <p className="text-sm text-blue-800">{method.instructions}</p>
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Membership Type</label>
                  <select
                    className="input w-full"
                    value={formData.membershipTypeId}
                    onChange={(e) => {
                      const type = membershipTypes.find(t => t.membershipTypeId === parseInt(e.target.value));
                      setFormData({
                        ...formData,
                        membershipTypeId: e.target.value,
                        amount: type?.annualFee || ''
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Membership Duration</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Paid</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Date</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction ID (optional)</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    placeholder="Zelle confirmation number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Scope</label>
                  <select
                    className="input w-full"
                    value={formData.paymentScope}
                    onChange={(e) => setFormData({ ...formData, paymentScope: e.target.value })}
                  >
                    <option value="Self">Individual (Self only)</option>
                    <option value="Family">Family Membership</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  className="input w-full"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Submitting...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Payment History */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-primary" />
          Payment History
        </h2>

        {status?.paymentHistory && status.paymentHistory.length > 0 ? (
          <div className="space-y-4">
            {status.paymentHistory.map((payment) => (
              <div
                key={`${payment.paymentId}-${payment.isCoveredByFamilyPayment ? 'family' : 'own'}`}
                className={`border rounded-lg p-4 ${
                  payment.status === 'Confirmed' ? 'border-green-200 bg-green-50' :
                  payment.status === 'Rejected' ? 'border-red-200 bg-red-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">${payment.amount}</span>
                      {getStatusBadge(payment.status)}
                      {payment.isCoveredByFamilyPayment && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Users className="w-3 h-3 mr-1" /> Family
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {payment.membershipTypeName} • {payment.durationName || '1 Year'} • {payment.paymentMethod}
                    </p>
                    {payment.isCoveredByFamilyPayment && payment.paidByUserName && (
                      <div className="mt-1 inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        <CreditCard className="w-4 h-4 mr-1" />
                        Paid by: {payment.paidByUserName}
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      Submitted: {formatDate(payment.createdAt)}
                    </p>
                    {payment.status === 'Confirmed' && (
                      <p className="text-sm text-green-600">
                        Valid: {formatDate(payment.validFrom)} - {formatDate(payment.validUntil)}
                      </p>
                    )}
                    {payment.status === 'Rejected' && payment.rejectionReason && (
                      <p className="text-sm text-red-600">
                        Reason: {payment.rejectionReason}
                      </p>
                    )}
                    {/* Show linked users for payments made by current user */}
                    {!payment.isCoveredByFamilyPayment && payment.coveredFamilyMembers && payment.coveredFamilyMembers.length > 0 && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm text-purple-800 font-semibold flex items-center mb-2">
                          <Users className="w-4 h-4 mr-1" />
                          Also applies to {payment.coveredFamilyMembers.length} family member{payment.coveredFamilyMembers.length > 1 ? 's' : ''}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {payment.coveredFamilyMembers.map((member) => (
                            <span
                              key={member.userId}
                              className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                            >
                              {member.firstName} {member.lastName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {payment.proofOfPaymentUrl && !payment.isCoveredByFamilyPayment && (
                    <a
                      href={getAssetUrl(payment.proofOfPaymentUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" /> View Proof
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No payment history</p>
        )}
      </div>
    </div>
  );
}
