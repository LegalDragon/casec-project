import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Linkedin, Twitter, ExternalLink } from 'lucide-react';
import api from '../services/api';

export default function BoardOfDirectors() {
  const [boardMembers, setBoardMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBoardMembers();
  }, []);

  const loadBoardMembers = async () => {
    try {
      const response = await api.get('/users/board-members');
      if (response.success) {
        setBoardMembers(response.data);
      }
    } catch (err) {
      console.error('Failed to load board members:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewProfile = (userId) => {
    navigate(`/board-profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading board members...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Award className="w-20 h-20 text-accent" />
            </div>
            <h1 className="text-5xl font-display font-extrabold mb-4">
              Board of Directors
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Meet the dedicated leaders guiding CASEC's mission to build stronger community connections
              and foster meaningful relationships among our members.
            </p>
          </div>
        </div>
      </div>

      {/* Board Members Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {boardMembers.map((member) => (
            <div
              key={member.userId}
              className="card hover:shadow-2xl transition-all duration-300 group"
            >
              {/* Avatar */}
              <div className="relative mb-6">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-64 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-6xl font-bold">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-accent text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                  {member.boardTitle}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-display font-bold text-gray-900">
                    {member.firstName} {member.lastName}
                  </h3>
                  {member.profession && (
                    <p className="text-primary font-semibold">{member.profession}</p>
                  )}
                </div>

                {member.boardBio && (
                  <p className="text-gray-600 line-clamp-4">{member.boardBio}</p>
                )}

                {/* Social Links */}
                {(member.linkedInUrl || member.twitterHandle) && (
                  <div className="flex space-x-3 pt-2">
                    {member.linkedInUrl && (
                      <a
                        href={member.linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-light transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {member.twitterHandle && (
                      <a
                        href={`https://twitter.com/${member.twitterHandle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-light transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}

                {/* View Profile Button */}
                <button
                  onClick={() => viewProfile(member.userId)}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2 mt-4 group-hover:bg-accent group-hover:border-accent"
                >
                  <span>View Full Profile</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {boardMembers.length === 0 && (
          <div className="text-center py-20">
            <Award className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-600 mb-2">
              No Board Members Listed
            </h3>
            <p className="text-gray-500">Board member information will be available soon.</p>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-primary to-accent text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            Join Our Community
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Become a member of CASEC and enjoy exclusive benefits, networking opportunities,
            and access to community events.
          </p>
          <a
            href="/register"
            className="btn bg-white text-primary hover:bg-gray-100 inline-block"
          >
            Become a Member
          </a>
        </div>
      </div>
    </div>
  );
}
