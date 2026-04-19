import { Link } from 'react-router-dom';
import { Zap, Star, Clock, TrendingUp, CheckCircle, ArrowRight, MessageSquare, BarChart2, Mail } from 'lucide-react';

const features = [
  { icon: Zap, title: 'AI-Powered Responses', desc: 'Claude AI generates professional, on-brand responses to every review in seconds.' },
  { icon: Star, title: 'Tone Customization', desc: 'Choose Professional, Friendly, or Apologetic tone to match your brand voice.' },
  { icon: Clock, title: 'Save Hours Weekly', desc: 'Stop spending hours writing responses. Handle all reviews in minutes.' },
  { icon: TrendingUp, title: 'Analytics Dashboard', desc: 'Track response rates, star ratings, and review trends over time.' },
  { icon: MessageSquare, title: 'Edit Before Sending', desc: 'Review and customize AI responses before copying them to Google.' },
  { icon: Mail, title: 'Daily Email Digest', desc: 'Get a morning summary of new reviews with ready-to-use responses.' },
];

const testimonials = [
  { name: 'Maria Chen', role: 'Hotel Manager, The Grand Pacific', text: 'ReviewPilot saves me 3-4 hours every week. The responses are so good, guests often comment on how personal they feel.', rating: 5 },
  { name: 'James Rodriguez', role: 'Owner, La Trattoria', text: "We went from responding to 20% of reviews to 95% in our first month. Our rating improved from 4.1 to 4.6 stars.", rating: 5 },
  { name: 'Sarah O\'Brien', role: 'GM, Coastal Boutique Hotel', text: 'The apologetic tone feature is incredible. It turns negative reviews into opportunities to show we care.', rating: 5 },
];

const pricing = [
  { tier: 'basic', name: 'Basic', price: 49, desc: 'Perfect for small businesses', features: ['Up to 50 reviews/month', 'AI response generation', '3 tone options', 'Response history', 'Email support'], cta: 'Start Basic' },
  { tier: 'pro', name: 'Pro', price: 99, desc: 'Most popular for growing businesses', features: ['Unlimited reviews/month', 'Everything in Basic', 'Analytics dashboard', 'Daily email summaries', 'Priority support'], cta: 'Start Pro', highlight: true },
  { tier: 'enterprise', name: 'Enterprise', price: 199, desc: 'For multi-location businesses', features: ['Everything in Pro', 'Multiple locations', 'Custom tone training', 'Team accounts', 'Dedicated account manager'], cta: 'Contact Sales' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand-600">
            <Zap className="w-6 h-6" />
            ReviewPilot
          </Link>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Start free trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-24 px-4 text-center bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Powered by Claude AI
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Reply to Google reviews<br />
            <span className="text-brand-600">10x faster with AI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            ReviewPilot generates professional, personalized responses to your Google reviews in seconds.
            Save hours every week and protect your online reputation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3">
              Start free trial <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <a href="#pricing" className="btn-secondary text-base px-8 py-3">View pricing</a>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Everything you need to manage reviews</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Built specifically for hotels, restaurants, and hospitality businesses that care about their reputation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-gray-600 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Loved by hospitality businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map(({ name, role, text, rating }) => (
              <div key={name} className="card p-6">
                <div className="flex mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 text-sm leading-relaxed">"{text}"</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{name}</p>
                  <p className="text-gray-500 text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-600 text-center mb-12">Start free. Upgrade when you're ready.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map(({ tier, name, price, desc, features: feats, cta, highlight }) => (
              <div key={tier} className={`card p-8 relative ${highlight ? 'ring-2 ring-brand-500' : ''}`}>
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-xl text-gray-900 mb-1">{name}</h3>
                <p className="text-gray-500 text-sm mb-4">{desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {feats.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block text-center py-2.5 px-4 rounded-lg font-medium transition-colors ${
                    highlight ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brand-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start protecting your reputation today</h2>
          <p className="text-brand-100 mb-8">Join hundreds of hospitality businesses using ReviewPilot to respond faster and grow their ratings.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-white">
            <Zap className="w-5 h-5 text-brand-400" />
            ReviewPilot
          </div>
          <p className="text-sm">© 2024 ReviewPilot. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="mailto:support@reviewpilot.app" className="hover:text-white">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
