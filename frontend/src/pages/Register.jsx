import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      navigate('/dashboard');
      toast.success('Welcome to ReviewPilot!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-brand-600 mb-6">
              <Zap className="w-7 h-7" />
              ReviewPilot
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Start your free trial</h1>
            <p className="text-gray-600 mt-1">No credit card required. 14 days free.</p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="label">Business / Your name</label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input"
                  placeholder="Grand Pacific Hotel"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input"
                  placeholder="Min 8 characters"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Creating account…' : 'Create free account'}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>

            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right - Benefits */}
      <div className="hidden lg:flex flex-1 bg-brand-600 items-center justify-center p-12">
        <div className="text-white max-w-sm">
          <h2 className="text-3xl font-bold mb-8">Start responding to reviews in minutes</h2>
          <ul className="space-y-4">
            {[
              'AI generates professional responses instantly',
              'Choose your tone: Professional, Friendly, or Apologetic',
              'Edit responses before copying to Google',
              'Track analytics and response rates',
              'Daily email digest of new reviews',
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-brand-200 flex-shrink-0 mt-0.5" />
                <span className="text-brand-100">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
