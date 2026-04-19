# ReviewPilot

AI-powered Google review response platform for hospitality businesses.

## Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **AI**: Anthropic Claude API
- **Payments**: Stripe
- **Deployment**: Vercel (frontend) + Railway (backend)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Anthropic API key
- Stripe API keys

### Setup

1. Clone repo and install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Set up backend env vars:
```bash
cp backend/.env.example backend/.env
# Fill in your API keys
```

3. Run database migrations:
```bash
cd backend && npm run db:migrate
```

4. Start development servers:
```bash
# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

## Deployment

### Frontend (Vercel)
- Connect GitHub repo to Vercel
- Set `VITE_API_URL` env var to your backend URL
- Deploy from `frontend/` directory

### Backend (Railway)
- Connect GitHub repo to Railway
- Set all env vars from `.env.example`
- Deploy from `backend/` directory

## Pricing
- **Basic**: $49/month — up to 50 reviews/month
- **Pro**: $99/month — unlimited reviews + analytics
- **Enterprise**: $199/month — multiple locations
