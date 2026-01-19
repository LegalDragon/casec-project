import { useEffect, useState } from 'react';
import { Users, Check, Shield, X, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clubsAPI, getAssetUrl } from '../services/api';
import { useAppStore, useAuthStore } from '../store/useStore';

export default function Clubs() {
  const { clubs, setClubs } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [viewingMembersClub, setViewingMembersClub] = useState(null); // Club object for members modal
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

  const openMembersModal = async (club) => {
    setViewingMembersClub(club);
    setLoadingMembers(true);
    await loadMembers(club.clubId);
  };

  const closeMembersModal = () => {
    setViewingMembersClub(null);
    setMembers([]);
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
        // Reload members if this club's modal is open
        if (viewingMembersClub?.clubId === confirmModal.clubId) {
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
              onClick={() => openMembersModal(club)}
              className="w-full text-sm text-primary hover:text-primary-light font-medium mb-3 flex items-center justify-center gap-2 py-2 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
            >
              <Users className="w-4 h-4" />
              View Members ({club.totalMembers || club.memberCount || 0})
            </button>

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

      {/* Members Modal */}
      {viewingMembersClub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {viewingMembersClub.avatarUrl ? (
                    <img
                      src={getAssetUrl(viewingMembersClub.avatarUrl)}
                      alt={viewingMembersClub.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl">
                      {viewingMembersClub.icon || '📚'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{viewingMembersClub.name}</h3>
                    <p className="text-sm text-gray-500">
                      {viewingMembersClub.totalMembers || viewingMembersClub.memberCount || 0} members
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeMembersModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingMembers ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  Loading members...
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No members yet</p>
                  <p className="text-sm">Be the first to join this club!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <Link
                      key={member.userId}
                      to={`/member/${member.userId}`}
                      onClick={closeMembersModal}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {member.avatarUrl ? (
                        <img
                          src={getAssetUrl(member.avatarUrl)}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        {member.isAdmin && (
                          <span className="inline-flex items-center text-xs text-amber-600">
                            <Shield className="w-3 h-3 mr-1" />
                            Club Admin
                          </span>
                        )}
                      </div>
                      <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={closeMembersModal}
                className="btn btn-secondary w-full"
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
