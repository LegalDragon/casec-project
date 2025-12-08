import { useState, useEffect, useRef } from 'react';
import { Save, Upload, Camera, Calendar, Users, Loader } from 'lucide-react';
import { usersAPI, getAssetUrl } from '../services/api';
import { useAuthStore } from '../store/useStore';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'];

export default function EnhancedProfile() {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
          chineseName: profile.chineseName || '',
          phoneNumber: profile.phoneNumber || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          zipCode: profile.zipCode || '',
          profession: profile.profession || '',
          hobbies: profile.hobbies || '',
          bio: profile.bio || '',
          gender: profile.gender || '',
          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
          maritalStatus: profile.maritalStatus || '',
          linkedInUrl: profile.linkedInUrl || '',
          twitterHandle: profile.twitterHandle || '',
        });
        setAvatarPreview(profile.avatarUrl);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    setUploadingAvatar(true);
    try {
      const response = await usersAPI.uploadAvatar(file);
      if (response.success) {
        updateUser({ avatarUrl: response.data.avatarUrl });
        setAvatarPreview(response.data.avatarUrl);
        alert('Avatar updated successfully!');
      }
    } catch (err) {
      alert('Avatar upload failed: ' + (err.message || 'Please try again'));
      // Revert preview on error
      loadProfile();
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Convert empty dateOfBirth to null for proper serialization
      const profileData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth || null,
      };
      const response = await usersAPI.updateProfile(profileData);
      if (response.success) {
        updateUser(formData);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      alert('Update failed: ' + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-600 text-lg">Manage your personal information and avatar</p>
      </div>

      <div className="card">
        {/* Avatar Section */}
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 mb-6 pb-6 border-b">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview.startsWith('data:') ? avatarPreview : getAssetUrl(avatarPreview)}
                alt="Avatar"
                className={`w-32 h-32 rounded-full object-cover border-4 border-primary ${uploadingAvatar ? 'opacity-50' : ''}`}
              />
            ) : (
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-4xl font-bold border-4 border-primary ${uploadingAvatar ? 'opacity-50' : ''}`}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 bg-accent text-white rounded-full p-3 hover:bg-accent-dark shadow-lg transition-all disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
            <p className="text-accent font-semibold">{user?.membershipTypeName}</p>
            <p className="text-gray-600 text-sm">{user?.email}</p>
            <p className="text-gray-500 text-xs mt-2">Click the camera icon to change your avatar</p>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                <input type="text" className="input w-full" value={formData.firstName || ''} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                <input type="text" className="input w-full" value={formData.lastName || ''} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">中文姓名 (Chinese Name)</label>
                <input type="text" className="input w-full" placeholder="例如：张三" value={formData.chineseName || ''} onChange={(e) => setFormData({...formData, chineseName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" className="input w-full bg-gray-100" value={user?.email || ''} disabled />
                <p className="text-xs text-gray-500 mt-1">Contact admin to change email</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input type="tel" className="input w-full" value={formData.phoneNumber || ''} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Personal Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                <select
                  className="input w-full"
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="">Select Gender</option>
                  {GENDER_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Date of Birth</span>
                  </span>
                </label>
                <input
                  type="date"
                  className="input w-full"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Marital Status</label>
                <select
                  className="input w-full"
                  value={formData.maritalStatus || ''}
                  onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                >
                  <option value="">Select Status</option>
                  {MARITAL_STATUS_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                <input type="text" className="input w-full" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input type="text" className="input w-full" value={formData.city || ''} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <input type="text" className="input w-full" value={formData.state || ''} onChange={(e) => setFormData({...formData, state: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                  <input type="text" className="input w-full" value={formData.zipCode || ''} onChange={(e) => setFormData({...formData, zipCode: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          {/* About You */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">About You</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Profession</label>
                  <input type="text" className="input w-full" placeholder="e.g., Software Engineer" value={formData.profession || ''} onChange={(e) => setFormData({...formData, profession: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hobbies & Interests</label>
                  <input type="text" className="input w-full" placeholder="e.g., Tennis, Photography, Cooking" value={formData.hobbies || ''} onChange={(e) => setFormData({...formData, hobbies: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                <textarea rows={4} className="input w-full resize-none" placeholder="Tell members about yourself..." value={formData.bio || ''} onChange={(e) => setFormData({...formData, bio: e.target.value})} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn URL</label>
                <input type="url" className="input w-full" placeholder="https://linkedin.com/in/yourname" value={formData.linkedInUrl || ''} onChange={(e) => setFormData({...formData, linkedInUrl: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Twitter Handle</label>
                <input type="text" className="input w-full" placeholder="@yourhandle" value={formData.twitterHandle || ''} onChange={(e) => setFormData({...formData, twitterHandle: e.target.value})} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary flex items-center space-x-2">
            <Save className="w-5 h-5" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
