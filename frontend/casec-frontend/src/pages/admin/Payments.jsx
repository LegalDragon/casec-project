import { useState, useEffect } from 'react';
import {
  CreditCard, Clock, CheckCircle, XCircle, Eye, Users,
  Calendar, DollarSign, Search, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { membershipPaymentsAPI } from '../../services/api';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);

  const [confirmForm, setConfirmForm] = useState({
    approve: true,
    rejectionReason: '',
    validFrom: '',
    validUntil: '',
    familyMemberIds: [],
    notes: ''
  });

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = filter !== 'All' ? { status: filter } : {};
      const response = await membershipPaymentsAPI.getAll(params);
      if (response.success) {
        setPayments(response.data);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async (userId) => {
    try {
      const response = await membershipPaymentsAPI.getUserFamily(userId);
      if (response.success) {
        setFamilyMembers(response.data);
      }
    } catch (err) {
      console.error('Failed to load family members:', err);
      setFamilyMembers([]);
    }
  };

  const handleExpandPayment = async (payment) => {
    if (expandedPayment === payment.paymentId) {
      setExpandedPayment(null);
      setFamilyMembers([]);
      return;
    }

    setExpandedPayment(payment.paymentId);

    // Set default validity dates
    const validFrom = new Date(payment.validFrom).toISOString().split('T')[0];
    const validUntil = new Date(payment.validUntil).toISOString().split('T')[0];
    setConfirmForm({
      approve: true,
      rejectionReason: '',
      validFrom,
      validUntil,
      familyMemberIds: [],
      notes: ''
    });

    // Load family members if this is a family payment
    if (payment.paymentScope === 'Family') {
      await loadFamilyMembers(payment.userId);
    } else {
      setFamilyMembers([]);
    }
  };

  const handleConfirmPayment = async (paymentId) => {
    setConfirmingId(paymentId);
    try {
      const response = await membershipPaymentsAPI.confirm(paymentId, {
        approve: confirmForm.approve,
        rejectionReason: confirmForm.rejectionReason || undefined,
        validFrom: confirmForm.validFrom ? new Date(confirmForm.validFrom).toISOString() : undefined,
        validUntil: confirmForm.validUntil ? new Date(confirmForm.validUntil).toISOString() : undefined,
        familyMemberIds: confirmForm.familyMemberIds.length > 0 ? confirmForm.familyMemberIds : undefined,
        notes: confirmForm.notes || undefined
      });

      if (response.success) {
        alert(confirmForm.approve ? 'Payment confirmed!' : 'Payment rejected');
        setExpandedPayment(null);
        loadPayments();
      }
    } catch (err) {
      alert('Failed to process payment: ' + (err.message || 'Please try again'));
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const pendingCount = payments.filter(p => p.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Membership Payments</h1>
          <p className="text-gray-600">Review and confirm member payments</p>
        </div>
        {pendingCount > 0 && filter !== 'Pending' && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium">
            {pendingCount} pending payment{pendingCount > 1 ? 's' : ''} awaiting review
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex space-x-2">
            {['Pending', 'Confirmed', 'Rejected', 'All'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
                {status === 'Pending' && pendingCount > 0 && (
                  <span className="ml-2 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : payments.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No {filter.toLowerCase()} payments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.paymentId} className="card">
              {/* Payment Summary Row */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleExpandPayment(payment)}
              >
                <div className="flex items-center space-x-4">
                  {payment.userAvatarUrl ? (
                    <img
                      src={payment.userAvatarUrl}
                      alt={payment.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                      {payment.userName.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{payment.userName}</p>
                    <p className="text-sm text-gray-500">{payment.userEmail}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">${payment.amount}</p>
                    <p className="text-sm text-gray-500">{payment.membershipTypeName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(payment.createdAt)}</p>
                    <p className="text-sm text-gray-500">{payment.paymentMethod}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(payment.status)}
                    {payment.paymentScope === 'Family' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Users className="w-3 h-3 mr-1" /> Family
                      </span>
                    )}
                  </div>
                  {expandedPayment === payment.paymentId ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedPayment === payment.paymentId && (
                <div className="mt-6 pt-6 border-t space-y-6">
                  {/* Payment Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Transaction ID</p>
                      <p className="font-medium">{payment.transactionId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Date</p>
                      <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Valid From</p>
                      <p className="font-medium">{formatDate(payment.validFrom)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Valid Until</p>
                      <p className="font-medium">{formatDate(payment.validUntil)}</p>
                    </div>
                  </div>

                  {/* Proof of Payment */}
                  {payment.proofOfPaymentUrl && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Proof of Payment</p>
                      <a
                        href={payment.proofOfPaymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary hover:underline"
                      >
                        <Eye className="w-4 h-4 mr-1" /> View Uploaded Proof
                      </a>
                    </div>
                  )}

                  {payment.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                      <p className="text-sm text-gray-600">{payment.notes}</p>
                    </div>
                  )}

                  {/* Confirmation Form - Only for Pending */}
                  {payment.status === 'Pending' && (
                    <div className="bg-blue-50 rounded-lg p-6 space-y-4">
                      <h3 className="font-semibold text-gray-900">Confirm Payment</h3>

                      {/* Approve/Reject Toggle */}
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`action-${payment.paymentId}`}
                            checked={confirmForm.approve}
                            onChange={() => setConfirmForm({ ...confirmForm, approve: true })}
                            className="mr-2"
                          />
                          <span className="text-green-700 font-medium">Approve</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`action-${payment.paymentId}`}
                            checked={!confirmForm.approve}
                            onChange={() => setConfirmForm({ ...confirmForm, approve: false })}
                            className="mr-2"
                          />
                          <span className="text-red-700 font-medium">Reject</span>
                        </label>
                      </div>

                      {confirmForm.approve ? (
                        <>
                          {/* Validity Dates */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                              <input
                                type="date"
                                className="input w-full"
                                value={confirmForm.validFrom}
                                onChange={(e) => setConfirmForm({ ...confirmForm, validFrom: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                              <input
                                type="date"
                                className="input w-full"
                                value={confirmForm.validUntil}
                                onChange={(e) => setConfirmForm({ ...confirmForm, validUntil: e.target.value })}
                              />
                            </div>
                          </div>

                          {/* Family Members Selection */}
                          {payment.paymentScope === 'Family' && familyMembers.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Apply Membership to Family Members
                              </label>
                              <div className="space-y-2">
                                {familyMembers.map((member) => (
                                  <label key={member.userId} className="flex items-center bg-white rounded-lg p-3 border">
                                    <input
                                      type="checkbox"
                                      checked={confirmForm.familyMemberIds.includes(member.userId)}
                                      onChange={(e) => {
                                        const ids = e.target.checked
                                          ? [...confirmForm.familyMemberIds, member.userId]
                                          : confirmForm.familyMemberIds.filter(id => id !== member.userId);
                                        setConfirmForm({ ...confirmForm, familyMemberIds: ids });
                                      }}
                                      className="mr-3"
                                    />
                                    {member.avatarUrl ? (
                                      <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full mr-2" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2 text-primary font-bold text-xs">
                                        {member.firstName[0]}{member.lastName[0]}
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-medium">{member.firstName} {member.lastName}</span>
                                      {member.relationship && (
                                        <span className="text-sm text-gray-500 ml-2">({member.relationship})</span>
                                      )}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                          <textarea
                            className="input w-full"
                            rows={2}
                            value={confirmForm.rejectionReason}
                            onChange={(e) => setConfirmForm({ ...confirmForm, rejectionReason: e.target.value })}
                            placeholder="Please provide a reason for rejection..."
                            required
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (optional)</label>
                        <input
                          type="text"
                          className="input w-full"
                          value={confirmForm.notes}
                          onChange={(e) => setConfirmForm({ ...confirmForm, notes: e.target.value })}
                          placeholder="Any additional notes..."
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => handleConfirmPayment(payment.paymentId)}
                          disabled={confirmingId === payment.paymentId || (!confirmForm.approve && !confirmForm.rejectionReason)}
                          className={`btn ${confirmForm.approve ? 'btn-primary' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                        >
                          {confirmingId === payment.paymentId
                            ? 'Processing...'
                            : confirmForm.approve
                              ? 'Confirm Payment'
                              : 'Reject Payment'
                          }
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show confirmation info for already processed payments */}
                  {payment.status !== 'Pending' && payment.confirmedByName && (
                    <div className={`rounded-lg p-4 ${payment.status === 'Confirmed' ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="text-sm">
                        <span className="font-semibold">
                          {payment.status === 'Confirmed' ? 'Confirmed' : 'Rejected'}
                        </span>
                        {' by '}{payment.confirmedByName} on {formatDate(payment.confirmedAt)}
                      </p>
                      {payment.rejectionReason && (
                        <p className="text-sm text-red-700 mt-1">Reason: {payment.rejectionReason}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
