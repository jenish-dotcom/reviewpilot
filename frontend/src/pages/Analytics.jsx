import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Star, MessageSquare, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await api.get('/analytics');
      return res.data;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  const ratingDist = [1, 2, 3, 4, 5].map(r => ({
    rating: `${r}★`,
    count: data?.ratingDistribution?.find(d => d.rating === r)?.count || 0,
  }));

  const weeklyData = (data?.weeklyTrend || []).map(w => ({
    week: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    reviews: w.count,
    avgRating: w.avgRating,
  }));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={MessageSquare} label="Total Reviews" value={data?.totalReviews ?? 0} color="brand" />
        <StatCard icon={Star} label="Average Rating" value={`${data?.avgRating ?? 0} ★`} color="yellow" />
        <StatCard icon={CheckCircle} label="Response Rate" value={`${data?.responseRate ?? 0}%`} color="green" />
        <StatCard icon={TrendingUp} label="Last 12 Weeks" value={weeklyData.reduce((s, w) => s + w.reviews, 0)} sub="reviews" color="blue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Rating distribution */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Rating Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingDist}>
              <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly trend */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Weekly Review Volume</h2>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="reviews" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No data yet — add some reviews to see trends
            </div>
          )}
        </div>
      </div>

      {/* Average rating trend */}
      {weeklyData.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Average Rating Trend (12 weeks)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v} ★`, 'Avg Rating']} />
              <Line type="monotone" dataKey="avgRating" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
