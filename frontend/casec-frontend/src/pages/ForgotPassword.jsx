import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authAPI, getAssetUrl } from '../services/api';
import { useTheme } from '../components/ThemeProvider';

export default function ForgotPassword() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      if (response.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-accent flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          {theme?.logoUrl ? (
            <img
              src={getAssetUrl(theme.logoUrl)}
              alt={theme.organizationName || 'Logo'}
              className="h-32 w-auto max-w-[200px] object-contain mx-auto mb-4"
            />
          ) : null}
          <h1 className="text-4xl font-display font-extrabold text-accent mb-2">
            {theme?.organizationName || 'CASEC'}<span className="text-accent-light">.</span>
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {success ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-6">
                If an account with that email exists, we've sent password reset instructions to your email address.
              </p>
              <Link
                to="/login"
                className="btn btn-primary w-full flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Login</span>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                Forgot Password?
              </h2>
              <p className="text-gray-600 mb-6">
                Enter your email address and we'll send you instructions to reset your password.
              </p>

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Mail className="w-5 h-5" />
                  <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-primary font-semibold hover:text-primary-light inline-flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          © {new Date().getFullYear()} {theme?.organizationName || 'CASEC'}. Community Membership Portal
        </p>
      </div>
    </div>
  );
}
