import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Check } from 'lucide-react';
import { authAPI, membershipTypesAPI, getAssetUrl } from '../services/api';
import { useAuthStore } from '../store/useStore';
import { useTheme } from '../components/ThemeProvider';

export default function Register() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    profession: '',
    hobbies: '',
    bio: '',
  });

  useEffect(() => {
    loadMembershipTypes();
  }, []);

  const loadMembershipTypes = async () => {
    try {
      const response = await membershipTypesAPI.getAll();
      if (response.success) {
        setMembershipTypes(response.data);
      }
    } catch (err) {
      console.error('Failed to load membership types:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!selectedType) {
      setError('Please select a membership type');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await authAPI.register({
        ...registrationData,
        membershipTypeId: selectedType,
      });

      if (response.success) {
        setAuth(response.data.user, response.data.token);
        navigate('/payment');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {theme?.logoUrl ? (
            <img
              src={getAssetUrl(theme.logoUrl)}
              alt={theme.organizationName || 'Logo'}
              className="h-32 w-auto max-w-[250px] object-contain mx-auto mb-4"
            />
          ) : (
            <h1 className="text-5xl font-display font-extrabold text-primary mb-2">
              {theme?.organizationName || 'CASEC'}<span className="text-accent">.</span>
            </h1>
          )}
          <p className="text-gray-600 text-lg">Join our vibrant community</p>
        </div>

        {/* Membership Type Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
            Choose Your Membership
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {membershipTypes.map((type) => (
              <div
                key={type.membershipTypeId}
                onClick={() => setSelectedType(type.membershipTypeId)}
                className={`card cursor-pointer relative ${
                  selectedType === type.membershipTypeId
                    ? 'ring-4 ring-primary shadow-2xl'
                    : 'hover:ring-2 hover:ring-gray-300'
                }`}
              >
                {selectedType === type.membershipTypeId && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="text-4xl mb-3">{type.icon || '👤'}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{type.name}</h3>
                <div className="text-3xl font-bold text-accent mb-3">
                  ${type.annualFee}<span className="text-sm text-gray-500">/year</span>
                </div>
                <p className="text-gray-600 text-sm">{type.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
            Your Information
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="input w-full"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="input w-full"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="input w-full"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  className="input w-full"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  className="input w-full"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="input w-full"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                className="input w-full"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  className="input w-full"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  className="input w-full"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  className="input w-full"
                  value={formData.zipCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profession
                </label>
                <input
                  type="text"
                  name="profession"
                  className="input w-full"
                  placeholder="e.g., Software Engineer"
                  value={formData.profession}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hobbies/Interests
                </label>
                <input
                  type="text"
                  name="hobbies"
                  className="input w-full"
                  placeholder="e.g., Tennis, Photography"
                  value={formData.hobbies}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                About You
              </label>
              <textarea
                name="bio"
                rows={4}
                className="input w-full resize-none"
                placeholder="Tell us a bit about yourself..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5" />
                <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              </button>
              <Link to="/login" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:text-primary-light">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
