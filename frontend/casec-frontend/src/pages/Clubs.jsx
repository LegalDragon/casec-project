import { useEffect, useState } from 'react';
import { Users, Check } from 'lucide-react';
import { clubsAPI, getAssetUrl } from '../services/api';
import { useAppStore } from '../store/useStore';

export default function Clubs() {
  const { clubs, setClubs } = useAppStore();
  const [loading, setLoading] = useState(true);

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

  const handleJoinLeave = async (clubId, isJoined) => {
    try {
      const response = isJoined 
        ? await clubsAPI.leave(clubId)
        : await clubsAPI.join(clubId);
      
      if (response.success) {
        loadClubs();
      }
    } catch (err) {
      alert('Action failed: ' + (err.message || 'Please try again'));
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
                <span>{club.memberCount} members</span>
              </span>
              {club.meetingFrequency && (
                <span>📅 {club.meetingFrequency}</span>
              )}
            </div>

            <button
              onClick={() => handleJoinLeave(club.clubId, club.isUserMember)}
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
          </div>
        ))}
      </div>
    </div>
  );
}
