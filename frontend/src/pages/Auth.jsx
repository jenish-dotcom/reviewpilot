import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', full_name: '', business_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">R</div>
          <span className="font-semibold text-xl text-gray-900">ReviewPilot</span>
        </Link>
        <h2 className="text-center text-2xl font-bold text-gray-900">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          {isLogin ? (
            <>Don't have an account? <Link to="/signup" className="text-indigo-600 font-medium hover:underline">Sign up free</Link></>
          ) : (
            <>Already have an account? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link></>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-100">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={set('full_name')}
                    className="input"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business name <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={form.business_name}
                    onChange={set('business_name')}
                    className="input"
                    placeholder="Smith's Restaurant"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                className="input"
                placeholder="jane@business.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={set('password')}
                className="input"
                placeholder={isLogin ? '••••••••' : 'At least 8 characters'}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {!isLogin && (
            <p className="mt-4 text-xs text-center text-gray-400">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
              No credit card required — 10 free responses per month.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
