import { useState, useEffect, useRef } from 'react';
import { Save, User, Camera, Upload, Linkedin, Twitter, MapPin, Phone, Briefcase, Heart, FileText } from 'lucide-react';
import { usersAPI, getAssetUrl } from '../services/api';
import { useAuthStore } from '../store/useStore';
import api from '../services/api';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await usersAPI.getProfile();
      if (response.success && response.data) {
        const profile = response.data;
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phoneNumber: profile.phoneNumber || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          zipCode: profile.zipCode || '',
          profession: profile.profession || '',
          hobbies: profile.hobbies || '',
          bio: profile.bio || '',
          linkedInUrl: profile.linkedInUrl || '',
          twitterHandle: profile.twitterHandle || '',
        });
        setAvatarUrl(profile.avatarUrl);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const response = await api.post('/users/profile', formData);
      if (response.success) {
        updateUser({ ...formData, avatarUrl });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      alert('Update failed: ' + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.length > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.success) {
        setAvatarUrl(response.data.avatarUrl);
        updateUser({ avatarUrl: response.data.avatarUrl });
      }
    } catch (err) {
      alert('Failed to upload avatar: ' + (err.message || 'Please try again'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-600 text-lg">Manage your personal information and preferences</p>
      </div>

      {/* Avatar Section */}
      <div className="card">
        <div className="flex items-center space-x-6">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={getAssetUrl(avatarUrl)}
                alt={`${user?.firstName} ${user?.lastName}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-4xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            )}
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
            <p className="text-accent font-semibold">{user?.membershipTypeName}</p>
            <p className="text-gray-600 text-sm">{user?.email}</p>
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="mt-3 text-sm text-primary hover:text-primary-dark flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Change Avatar'}</span>
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-primary" />
            <span>Basic Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                className="input w-full"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                className="input w-full"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number</span>
                </span>
              </label>
              <input
                type="tel"
                className="input w-full"
                value={formData.phoneNumber || ''}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                placeholder="(xxx) xxx-xxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center space-x-1">
                  <Briefcase className="w-4 h-4" />
                  <span>Profession</span>
                </span>
              </label>
              <input
                type="text"
                className="input w-full"
                value={formData.profession || ''}
                onChange={(e) => setFormData({...formData, profession: e.target.value})}
                placeholder="e.g. Software Engineer"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span>Address</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                className="input w-full"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  placeholder="CA"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.zipCode || ''}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                  placeholder="12345"
                />
              </div>
            </div>
          </div>
        </div>

        {/* About You */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>About You</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>Hobbies & Interests</span>
                </span>
              </label>
              <input
                type="text"
                className="input w-full"
                value={formData.hobbies || ''}
                onChange={(e) => setFormData({...formData, hobbies: e.target.value})}
                placeholder="e.g. Reading, Tennis, Photography"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
              <textarea
                rows={4}
                className="input w-full resize-none"
                value={formData.bio || ''}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell other members about yourself..."
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center space-x-1">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span>LinkedIn URL</span>
                </span>
              </label>
              <input
                type="url"
                className="input w-full"
                value={formData.linkedInUrl || ''}
                onChange={(e) => setFormData({...formData, linkedInUrl: e.target.value})}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center space-x-1">
                  <Twitter className="w-4 h-4 text-sky-500" />
                  <span>Twitter Handle</span>
                </span>
              </label>
              <input
                type="text"
                className="input w-full"
                value={formData.twitterHandle || ''}
                onChange={(e) => setFormData({...formData, twitterHandle: e.target.value})}
                placeholder="@yourhandle"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2 px-8"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
