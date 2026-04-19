import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const toneOptions = [
  { value: 'professional', label: 'Professional', desc: 'Formal and business-appropriate. Best for hotels and upscale establishments.' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm and conversational. Great for casual restaurants and cafes.' },
  { value: 'apologetic', label: 'Apologetic', desc: 'Empathetic, focused on resolution. Ideal when handling negative reviews.' },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    tone: 'professional',
    emailSummaryEnabled: true,
    emailSummaryTime: '08:00',
    businessName: '',
    businessType: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        tone: data.tone || 'professional',
        emailSummaryEnabled: data.emailSummaryEnabled ?? true,
        emailSummaryTime: data.emailSummaryTime || '08:00',
        businessName: data.businessName || '',
        businessType: data.businessType || '',
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (values) => {
      const res = await api.put('/settings', values);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved!');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-gray-500 text-sm mb-6">Customize how ReviewPilot generates responses for your business.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Business Information</h2>
          <div>
            <label className="label">Business Name</label>
            <input
              type="text"
              value={form.businessName}
              onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
              className="input"
              placeholder="e.g. The Grand Pacific Hotel"
            />
            <p className="text-xs text-gray-500 mt-1">Used to personalize AI responses</p>
          </div>
          <div>
            <label className="label">Business Type</label>
            <select
              value={form.businessType}
              onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}
              className="input"
            >
              <option value="">Select type…</option>
              <option value="hotel">Hotel</option>
              <option value="restaurant">Restaurant</option>
              <option value="cafe">Cafe / Coffee Shop</option>
              <option value="bar">Bar / Pub</option>
              <option value="resort">Resort</option>
              <option value="b&b">Bed & Breakfast</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Tone */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Response Tone</h2>
          <div className="space-y-3">
            {toneOptions.map(({ value, label, desc }) => (
              <label key={value} className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                form.tone === value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="tone"
                  value={value}
                  checked={form.tone === value}
                  onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}
                  className="mt-0.5 text-brand-600"
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Email Notifications</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.emailSummaryEnabled}
              onChange={e => setForm(f => ({ ...f, emailSummaryEnabled: e.target.checked }))}
              className="w-4 h-4 rounded text-brand-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Daily email summary</p>
              <p className="text-xs text-gray-500">Get a morning digest of new reviews with AI responses ready to copy</p>
            </div>
          </label>
          {form.emailSummaryEnabled && (
            <div>
              <label className="label">Summary time</label>
              <input
                type="time"
                value={form.emailSummaryTime}
                onChange={e => setForm(f => ({ ...f, emailSummaryTime: e.target.value }))}
                className="input w-auto"
              />
            </div>
          )}
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary">
          {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
        </button>
      </form>
    </div>
  );
}
