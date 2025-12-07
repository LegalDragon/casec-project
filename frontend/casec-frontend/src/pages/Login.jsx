import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { authAPI, getAssetUrl } from '../services/api';
import { useAuthStore } from '../store/useStore';
import { useTheme } from '../components/ThemeProvider';

export default function Login() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      if (response.success) {
        setAuth(response.data.user, response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-accent flex items-center justify-center px-1">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-2">
          {theme?.logoUrl ? (
            <img
              src={getAssetUrl(theme.logoUrl)}
              alt={theme.organizationName || 'Logo'}
              className="h-96 w-auto max-w-[280px] object-contain mx-auto mb-1"
            />
          ) : null}
           <h1 className="text-5xl font-display font-extrabold text-accent mb-2">
              {theme?.organizationName || 'CASEC'}<span className="text-accent-light">.</span>
            </h1>
          <p className="text-white/80 text-lg">Welcome back to your community</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
            Sign In
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                className="input w-full"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                className="input w-full"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-light font-medium">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:text-primary-light">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          © {new Date().getFullYear()} {theme?.organizationName || 'CASEC'}. Community Membership Portal
        </p>
      </div>
    </div>
  );
}
