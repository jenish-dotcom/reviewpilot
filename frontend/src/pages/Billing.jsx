import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Zap, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const TIERS = [
  {
    tier: 'basic',
    name: 'Basic',
    price: 49,
    limit: '50 reviews/month',
    features: ['Up to 50 reviews/month', 'AI response generation', '3 tone options', 'Response history', 'Email support'],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 99,
    limit: 'Unlimited reviews',
    features: ['Unlimited reviews/month', 'Everything in Basic', 'Analytics dashboard', 'Daily email summaries', 'Priority support'],
    highlight: true,
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 199,
    limit: 'Multiple locations',
    features: ['Everything in Pro', 'Multiple locations', 'Custom tone training', 'Team accounts', 'Dedicated account manager'],
  },
];

export default function Billing() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success')) toast.success('Subscription activated! Welcome to ReviewPilot.');
    if (searchParams.get('canceled')) toast('Checkout canceled.', { icon: 'ℹ️' });
  }, []);

  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await api.get('/billing/subscription');
      return res.data;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (tier) => {
      const res = await api.post('/billing/checkout', { tier });
      return res.data;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => toast.error('Failed to start checkout'),
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/billing/portal');
      return res.data;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => toast.error('Failed to open billing portal'),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  const currentTier = sub?.tier || 'free';
  const isActive = sub?.status === 'active';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your subscription</p>
        </div>
        {isActive && (
          <button
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            className="btn-secondary text-sm"
          >
            {portalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4 mr-2" /> Manage Billing</>}
          </button>
        )}
      </div>

      {/* Current plan */}
      <div className="card p-5 mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Current plan</p>
          <p className="font-bold text-gray-900 text-lg capitalize">{currentTier} {isActive ? '(Active)' : currentTier !== 'free' ? '(Inactive)' : ''}</p>
          {sub?.reviewsThisMonth !== undefined && (
            <p className="text-sm text-gray-500 mt-0.5">{sub.reviewsThisMonth} reviews used this month</p>
          )}
        </div>
        {currentTier === 'free' && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <Zap className="w-4 h-4" />
            Upgrade to get more reviews
          </div>
        )}
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map(({ tier, name, price, limit, features, highlight }) => {
          const isCurrent = currentTier === tier && isActive;
          return (
            <div key={tier} className={`card p-6 relative ${highlight ? 'ring-2 ring-brand-500' : ''}`}>
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="font-bold text-lg text-gray-900 mb-1">{name}</h3>
              <p className="text-sm text-gray-500 mb-4">{limit}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">${price}</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="text-center py-2.5 px-4 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                  Current Plan ✓
                </div>
              ) : (
                <button
                  onClick={() => checkoutMutation.mutate(tier)}
                  disabled={checkoutMutation.isPending}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors text-sm ${
                    highlight ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Upgrade to ${name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
