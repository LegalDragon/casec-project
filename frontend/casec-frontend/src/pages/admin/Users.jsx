import { useState, useEffect } from 'react';
import { Edit, Trash2, Search, UserPlus, Shield, ShieldOff, CheckCircle, XCircle, Calendar, Filter, X } from 'lucide-react';
import api, { getAssetUrl, clubsAPI, membershipTypesAPI } from '../../services/api';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({});

  // Filter states
  const [clubFilter, setClubFilter] = useState('');
  const [directorFilter, setDirectorFilter] = useState(''); // '', 'yes', 'no'
  const [membershipFilter, setMembershipFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchClubs();
    fetchMembershipTypes();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/all');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await clubsAPI.getAll();
      if (response.success) {
        setClubs(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const fetchMembershipTypes = async () => {
    try {
      const response = await membershipTypesAPI.getAll();
      if (response.success) {
        setMembershipTypes(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching membership types:', error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      chineseName: user.chineseName || '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      membershipTypeId: user.membershipTypeId,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      isBoardMember: user.isBoardMember || false,
      boardTitle: user.boardTitle || '',
      boardDisplayOrder: user.boardDisplayOrder || 0,
      memberSince: user.memberSince ? user.memberSince.split('T')[0] : '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editingUser.userId}/admin-edit`, formData);
      alert('User updated successfully!');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const toggleAdmin = async (userId, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin privileges?`)) return;
    
    try {
      await api.put(`/users/${userId}/admin-edit`, { isAdmin: !currentStatus });
      alert('Admin status updated!');
      fetchUsers();
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Failed to update admin status');
    }
  };

  const toggleActive = async (userId, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
    
    try {
      await api.put(`/users/${userId}/admin-edit`, { isActive: !currentStatus });
      alert('User status updated!');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const activeFilterCount = [clubFilter, directorFilter, membershipFilter].filter(f => f !== '').length;

  const clearFilters = () => {
    setClubFilter('');
    setDirectorFilter('');
    setMembershipFilter('');
  };

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Club filter
    if (clubFilter) {
      const clubId = parseInt(clubFilter);
      if (!user.clubIds || !user.clubIds.includes(clubId)) {
        return false;
      }
    }

    // Director (Board Member) filter
    if (directorFilter === 'yes' && !user.isBoardMember) return false;
    if (directorFilter === 'no' && user.isBoardMember) return false;

    // Membership type filter
    if (membershipFilter) {
      const membershipId = parseInt(membershipFilter);
      if (user.membershipTypeId !== membershipId) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters || activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-primary rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="card bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Filter Users</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Club Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club Membership</label>
                <select
                  value={clubFilter}
                  onChange={(e) => setClubFilter(e.target.value)}
                  className="input w-full"
                >
                  <option value="">All Clubs</option>
                  {clubs.map((club) => (
                    <option key={club.clubId} value={club.clubId}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Director Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Board Member / Director</label>
                <select
                  value={directorFilter}
                  onChange={(e) => setDirectorFilter(e.target.value)}
                  className="input w-full"
                >
                  <option value="">All</option>
                  <option value="yes">Directors Only</option>
                  <option value="no">Non-Directors Only</option>
                </select>
              </div>

              {/* Membership Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
                <select
                  value={membershipFilter}
                  onChange={(e) => setMembershipFilter(e.target.value)}
                  className="input w-full"
                >
                  <option value="">All Membership Types</option>
                  {membershipTypes.map((type) => (
                    <option key={type.membershipTypeId} value={type.membershipTypeId}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="flex flex-wrap gap-2">
            {clubFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                Club: {clubs.find(c => c.clubId === parseInt(clubFilter))?.name}
                <button onClick={() => setClubFilter('')} className="hover:text-primary-dark">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {directorFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                {directorFilter === 'yes' ? 'Directors Only' : 'Non-Directors Only'}
                <button onClick={() => setDirectorFilter('')} className="hover:text-primary-dark">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {membershipFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                Membership: {membershipTypes.find(m => m.membershipTypeId === parseInt(membershipFilter))?.name}
                <button onClick={() => setMembershipFilter('')} className="hover:text-primary-dark">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={getAssetUrl(user.avatarUrl)}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.chineseName && <span className="text-primary">{user.chineseName} </span>}
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.userId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phoneNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {user.membershipTypeName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {user.isAdmin && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          <Shield className="w-3 h-3 mr-1" /> Admin
                        </span>
                      )}
                      {user.isBoardMember && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Board Member
                        </span>
                      )}
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-primary hover:text-primary-dark"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleAdmin(user.userId, user.isAdmin)}
                      className={user.isAdmin ? 'text-red-600 hover:text-red-900' : 'text-blue-600 hover:text-blue-900'}
                      title={user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    >
                      {user.isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => toggleActive(user.userId, user.isActive)}
                      className={user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                {editingUser.avatarUrl ? (
                  <img
                    src={getAssetUrl(editingUser.avatarUrl)}
                    alt={`${editingUser.firstName} ${editingUser.lastName}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                    {editingUser.firstName[0]}{editingUser.lastName[0]}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">Edit User</h2>
                  <p className="text-gray-500 text-sm">{editingUser.email}</p>
                </div>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    中文姓名 (Chinese Name)
                  </label>
                  <input
                    type="text"
                    value={formData.chineseName}
                    onChange={(e) => setFormData({ ...formData, chineseName: e.target.value })}
                    className="input"
                    placeholder="例如：张三"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Admin</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isBoardMember}
                      onChange={(e) => setFormData({ ...formData, isBoardMember: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Board Member</span>
                  </label>
                </div>

                {formData.isBoardMember && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Board Title
                      </label>
                      <input
                        type="text"
                        value={formData.boardTitle}
                        onChange={(e) => setFormData({ ...formData, boardTitle: e.target.value })}
                        className="input"
                        placeholder="e.g., President, Vice President"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={formData.boardDisplayOrder}
                        onChange={(e) => setFormData({ ...formData, boardDisplayOrder: parseInt(e.target.value) || 0 })}
                        className="input"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Since
                  </label>
                  <input
                    type="date"
                    value={formData.memberSince}
                    onChange={(e) => setFormData({ ...formData, memberSince: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
