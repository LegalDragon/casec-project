import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Clock, CheckCircle, XCircle, Eye, Users,
  Calendar, DollarSign, Search, Filter, ChevronDown, ChevronUp, X, UserPlus
} from 'lucide-react';
import { membershipPaymentsAPI, getAssetUrl } from '../../services/api';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);

  // User search for family linking
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [linkedUsers, setLinkedUsers] = useState([]);

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
  }, [filter, searchQuery]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'All') params.status = filter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
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

  // Debounced user search
  const searchUsers = useCallback(async (query, excludeUserId) => {
    if (!query || query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const response = await membershipPaymentsAPI.searchUsers(query, excludeUserId);
      if (response.success) {
        // Filter out already linked users
        const linkedIds = linkedUsers.map(u => u.userId);
        setUserSearchResults(response.data.filter(u => !linkedIds.includes(u.userId)));
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearchingUsers(false);
    }
  }, [linkedUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchQuery && expandedPayment) {
        const payment = payments.find(p => p.paymentId === expandedPayment);
        searchUsers(userSearchQuery, payment?.userId);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, expandedPayment, payments, searchUsers]);

  const addLinkedUser = (user) => {
    if (!linkedUsers.find(u => u.userId === user.userId)) {
      setLinkedUsers([...linkedUsers, user]);
      setConfirmForm(prev => ({
        ...prev,
        familyMemberIds: [...prev.familyMemberIds, user.userId]
      }));
    }
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const removeLinkedUser = (userId) => {
    setLinkedUsers(linkedUsers.filter(u => u.userId !== userId));
    setConfirmForm(prev => ({
      ...prev,
      familyMemberIds: prev.familyMemberIds.filter(id => id !== userId)
    }));
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
      setLinkedUsers([]);
      setUserSearchQuery('');
      setUserSearchResults([]);
      return;
    }

    setExpandedPayment(payment.paymentId);
    setLinkedUsers([]);
    setUserSearchQuery('');
    setUserSearchResults([]);

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

    // Always try to load existing family members for linking
    await loadFamilyMembers(payment.userId);
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
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center space-x-4 flex-1">
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 w-full md:w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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

                          {/* Link Family Members - Available for all payments */}
                          <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Users className="inline w-4 h-4 mr-1" />
                              Link Family Members to This Membership
                              {payment.paymentScope !== 'Family' && (
                                <span className="text-xs text-gray-500 font-normal ml-2">(optional)</span>
                              )}
                            </label>

                            {/* Existing family members from user's family group */}
                            {familyMembers.length > 0 && (
                              <div className="space-y-2 mb-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Existing Family Group Members</p>
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
                                      <img src={getAssetUrl(member.avatarUrl)} alt="" className="w-8 h-8 rounded-full mr-2" />
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
                            )}

                            {/* Search and link other users */}
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                <UserPlus className="inline w-3 h-3 mr-1" />
                                Search & Link Other Users
                              </p>

                              {/* Linked users list */}
                              {linkedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {linkedUsers.map((user) => (
                                    <span
                                      key={user.userId}
                                      className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                                    >
                                      {user.firstName} {user.lastName}
                                      <button
                                        onClick={() => removeLinkedUser(user.userId)}
                                        className="ml-2 hover:text-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* User search input */}
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search users by name or email..."
                                  value={userSearchQuery}
                                  onChange={(e) => setUserSearchQuery(e.target.value)}
                                  className="input pl-9 w-full"
                                />
                                {searchingUsers && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>
                                )}
                              </div>

                              {/* Search results dropdown */}
                              {userSearchResults.length > 0 && (
                                <div className="bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                  {userSearchResults.map((user) => (
                                    <button
                                      key={user.userId}
                                      onClick={() => addLinkedUser(user)}
                                      className="w-full flex items-center p-3 hover:bg-gray-50 border-b last:border-b-0"
                                    >
                                      {user.avatarUrl ? (
                                        <img src={getAssetUrl(user.avatarUrl)} alt="" className="w-8 h-8 rounded-full mr-3" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 text-primary font-bold text-xs">
                                          {user.firstName[0]}{user.lastName[0]}
                                        </div>
                                      )}
                                      <div className="text-left">
                                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {linkedUsers.length === 0 && familyMembers.length === 0 && !userSearchQuery && (
                                <p className="text-sm text-gray-500 italic">
                                  Search for users above to link them to this membership
                                </p>
                              )}
                            </div>
                          </div>
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

                  {/* Show and edit linked users for confirmed payments */}
                  {payment.status === 'Confirmed' && (
                    <LinkedUsersSection
                      payment={payment}
                      onUpdate={loadPayments}
                    />
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

// Component to manage linked users on confirmed payments
function LinkedUsersSection({ payment, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [linkedUserIds, setLinkedUserIds] = useState(payment.coveredFamilyMemberIds || []);
  // Initialize linkedUsers from the DTO's coveredFamilyMembers
  const [linkedUsers, setLinkedUsers] = useState(payment.coveredFamilyMembers || []);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  // Update state when payment prop changes
  useEffect(() => {
    setLinkedUserIds(payment.coveredFamilyMemberIds || []);
    setLinkedUsers(payment.coveredFamilyMembers || []);
  }, [payment.coveredFamilyMemberIds, payment.coveredFamilyMembers]);

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const response = await membershipPaymentsAPI.searchUsers(query, payment.userId);
      if (response.success) {
        // Filter out already linked users
        setUserSearchResults(response.data.filter(u => !linkedUserIds.includes(u.userId)));
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchQuery) searchUsers(userSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const addUser = (user) => {
    if (!linkedUserIds.includes(user.userId)) {
      setLinkedUserIds([...linkedUserIds, user.userId]);
      setLinkedUsers([...linkedUsers, user]);
    }
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const removeUser = (userId) => {
    setLinkedUserIds(linkedUserIds.filter(id => id !== userId));
    setLinkedUsers(linkedUsers.filter(u => u.userId !== userId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await membershipPaymentsAPI.updateLinkedUsers(payment.paymentId, linkedUserIds);
      if (response.success) {
        alert('Linked users updated successfully');
        setEditing(false);
        onUpdate();
      }
    } catch (err) {
      alert('Failed to update linked users: ' + (err.message || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLinkedUserIds(payment.coveredFamilyMemberIds || []);
    setLinkedUsers(payment.coveredFamilyMembers || []);
    setEditing(false);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-700 flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Linked Family Members ({linkedUserIds.length})
        </h4>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-primary hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {linkedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {linkedUsers.map((user) => (
            <span
              key={user.userId}
              className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
            >
              {user.firstName} {user.lastName}
              {editing && (
                <button
                  onClick={() => removeUser(user.userId)}
                  className="ml-2 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {linkedUsers.length === 0 && !editing && (
        <p className="text-sm text-gray-500 italic">No linked family members</p>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users to link..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="input pl-9 w-full"
            />
            {searchingUsers && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          {userSearchResults.length > 0 && (
            <div className="bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {userSearchResults.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => addUser(user)}
                  className="w-full flex items-center p-2 hover:bg-gray-50 border-b last:border-b-0 text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-2 text-primary font-bold text-xs">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="btn btn-secondary text-sm"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary text-sm"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
