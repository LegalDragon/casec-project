import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { authAPI, getAssetUrl } from '../services/api';
import { useTheme } from '../components/ThemeProvider';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setVerifying(false);
      setTokenValid(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await authAPI.verifyResetToken(token);
      setTokenValid(response.success);
    } catch (err) {
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword(token, formData.newPassword);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-accent flex items-center justify-center">
        <div className="text-white text-xl">Verifying reset token...</div>
      </div>
    );
  }

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
          {!tokenValid ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
                Invalid or Expired Link
              </h2>
              <p className="text-gray-600 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="btn btn-primary w-full flex items-center justify-center space-x-2"
              >
                <span>Request New Link</span>
              </Link>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="text-primary font-semibold hover:text-primary-light inline-flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
                Password Reset Successfully
              </h2>
              <p className="text-gray-600 mb-6">
                Your password has been reset. Redirecting to login...
              </p>
              <Link
                to="/login"
                className="btn btn-primary w-full flex items-center justify-center space-x-2"
              >
                <span>Go to Login</span>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                Reset Your Password
              </h2>
              <p className="text-gray-600 mb-6">
                Enter your new password below.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    className="input w-full"
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    className="input w-full"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Lock className="w-5 h-5" />
                  <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
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
