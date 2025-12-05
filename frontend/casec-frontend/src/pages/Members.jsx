import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Briefcase, MapPin, Calendar, ExternalLink } from 'lucide-react';
import api from '../services/api';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [professionFilter, setProfessionFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await api.get('/users/search');
      if (response.success) {
        setMembers(response.data);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewProfile = (userId) => {
    navigate(`/member/${userId}`);
  };

  // Get unique professions and cities for filters
  const professions = [...new Set(members.map(m => m.profession).filter(Boolean))].sort();
  const cities = [...new Set(members.map(m => m.city).filter(Boolean))].sort();

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = searchTerm === '' ||
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.hobbies?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProfession = professionFilter === '' || member.profession === professionFilter;
    const matchesCity = cityFilter === '' || member.city === cityFilter;

    return matchesSearch && matchesProfession && matchesCity;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Member Directory</h1>
        <p className="text-gray-600 text-lg">Connect with fellow CASEC members</p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, profession, or interests..."
                className="input w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="input w-full"
              value={professionFilter}
              onChange={(e) => setProfessionFilter(e.target.value)}
            >
              <option value="">All Professions</option>
              {professions.map(profession => (
                <option key={profession} value={profession}>{profession}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="input w-full"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filteredMembers.length} of {members.length} members</span>
          {(searchTerm || professionFilter || cityFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setProfessionFilter('');
                setCityFilter('');
              }}
              className="text-primary hover:text-primary-dark"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <div
            key={member.userId}
            className="card hover:shadow-xl transition-all duration-300 group cursor-pointer"
            onClick={() => viewProfile(member.userId)}
          >
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {member.firstName?.[0]}{member.lastName?.[0]}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                  {member.firstName} {member.lastName}
                </h3>
                {member.isBoardMember && member.boardTitle && (
                  <span className="inline-block px-2 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded mb-1">
                    {member.boardTitle}
                  </span>
                )}
                {member.profession && (
                  <p className="flex items-center text-sm text-gray-600 truncate">
                    <Briefcase className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    {member.profession}
                  </p>
                )}
                {member.city && member.state && (
                  <p className="flex items-center text-sm text-gray-500 truncate">
                    <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    {member.city}, {member.state}
                  </p>
                )}
                <p className="flex items-center text-xs text-gray-400 mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  Member since {new Date(member.memberSince).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Hover action */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">{member.membershipTypeName}</span>
              <span className="flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                View Profile
                <ExternalLink className="w-4 h-4 ml-1" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">No Members Found</h3>
          <p className="text-gray-500">
            {searchTerm || professionFilter || cityFilter
              ? 'Try adjusting your search criteria'
              : 'No members are currently available to display'}
          </p>
        </div>
      )}
    </div>
  );
}
