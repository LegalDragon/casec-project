import { useEffect, useState } from 'react';
import { Users, Check, ChevronDown, ChevronUp, Shield, X, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clubsAPI, getAssetUrl } from '../services/api';
import { useAppStore, useAuthStore } from '../store/useStore';

export default function Clubs() {
  const { clubs, setClubs } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [expandedClub, setExpandedClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { clubId, clubName, action: 'join' | 'leave' }
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const response = await clubsAPI.getAll();
      if (response.success) {
        setClubs(response.data);
      }
    } catch (err) {
      console.error('Failed to load clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (clubId) => {
    setLoadingMembers(true);
    try {
      const response = await clubsAPI.getMembers(clubId);
      if (response.success) {
        setMembers(response.data);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleExpand = async (clubId) => {
    if (expandedClub === clubId) {
      setExpandedClub(null);
      setMembers([]);
    } else {
      setExpandedClub(clubId);
      await loadMembers(clubId);
    }
  };

  const openConfirmModal = (clubId, clubName, action) => {
    setConfirmModal({ clubId, clubName, action });
  };

  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;

    setActionLoading(true);
    try {
      const response = confirmModal.action === 'leave'
        ? await clubsAPI.leave(confirmModal.clubId)
        : await clubsAPI.join(confirmModal.clubId);

      if (response.success) {
        loadClubs();
        // Reload members if this club is expanded
        if (expandedClub === confirmModal.clubId) {
          await loadMembers(confirmModal.clubId);
        }
        closeConfirmModal();
      }
    } catch (err) {
      alert('Action failed: ' + (err.message || 'Please try again'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading clubs...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
          Community Clubs
        </h1>
        <p className="text-gray-600 text-lg">
          Join clubs that match your interests and connect with like-minded members
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <div key={club.clubId} className="card">
            <div className="flex items-center space-x-3 mb-4">
              {club.avatarUrl ? (
                <img
                  src={getAssetUrl(club.avatarUrl)}
                  alt={club.name}
                  className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl">
                  {club.icon || '📚'}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{club.name}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{club.description}</p>

            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{club.totalMembers || club.memberCount || 0} members</span>
              </span>
              {club.meetingSchedule && (
                <span>📅 {club.meetingSchedule}</span>
              )}
            </div>

            {/* View Members Button */}
            <button
              onClick={() => toggleExpand(club.clubId)}
              className="w-full text-left text-sm text-primary hover:text-primary-light font-medium mb-3 flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                View Members
              </span>
              {expandedClub === club.clubId ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Members List (Expanded) */}
            {expandedClub === club.clubId && (
              <div className="border-t border-gray-200 pt-3 mb-4">
                {loadingMembers ? (
                  <div className="text-center py-4 text-gray-500 text-sm">Loading members...</div>
                ) : members.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">No members yet</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {members.map((member) => (
                      <Link
                        key={member.userId}
                        to={`/members/${member.userId}`}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {member.avatarUrl ? (
                          <img
                            src={getAssetUrl(member.avatarUrl)}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.firstName} {member.lastName}
                          </p>
                          {member.isAdmin && (
                            <span className="inline-flex items-center text-xs text-amber-600">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </span>
                          )}
                        </div>
                        <LinkIcon className="w-4 h-4 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Join/Leave Button */}
            {isAuthenticated ? (
              <button
                onClick={() => openConfirmModal(club.clubId, club.name, club.isUserMember ? 'leave' : 'join')}
                className={`btn w-full ${club.isUserMember ? 'btn-secondary' : 'btn-primary'}`}
              >
                {club.isUserMember ? (
                  <span className="flex items-center justify-center space-x-2">
                    <Check className="w-4 h-4" />
                    <span>Joined</span>
                  </span>
                ) : (
                  'Join Club'
                )}
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary w-full text-center">
                Login to Join
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {confirmModal.action === 'join' ? 'Join Club' : 'Leave Club'}
              </h3>
              <button
                onClick={closeConfirmModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              {confirmModal.action === 'join'
                ? `Are you sure you want to join "${confirmModal.clubName}"?`
                : `Are you sure you want to leave "${confirmModal.clubName}"? You can rejoin at any time.`
              }
            </p>

            <div className="flex space-x-3">
              <button
                onClick={closeConfirmModal}
                disabled={actionLoading}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`btn flex-1 ${confirmModal.action === 'leave' ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'}`}
              >
                {actionLoading
                  ? 'Processing...'
                  : confirmModal.action === 'join' ? 'Join' : 'Leave'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
