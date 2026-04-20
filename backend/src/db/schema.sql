-- ReviewPilot Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  business_name VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'free', -- free, active, canceled, past_due
  subscription_plan VARCHAR(50) DEFAULT 'free', -- free, starter, pro
  subscription_current_period_end TIMESTAMPTZ,
  email_summary_enabled BOOLEAN DEFAULT true,
  email_summary_time VARCHAR(10) DEFAULT '08:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review responses table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_review TEXT NOT NULL,
  reviewer_name VARCHAR(255),
  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  ai_response TEXT,
  tone VARCHAR(50) DEFAULT 'professional', -- professional, friendly, apologetic
  status VARCHAR(50) DEFAULT 'pending', -- pending, generated, copied
  platform VARCHAR(50) DEFAULT 'google', -- google, yelp, tripadvisor
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  default_tone VARCHAR(50) DEFAULT 'professional',
  business_description TEXT,
  custom_instructions TEXT,
  response_length VARCHAR(50) DEFAULT 'medium', -- short, medium, long
  include_business_name BOOLEAN DEFAULT true,
  auto_copy BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email summary logs
CREATE TABLE IF NOT EXISTS email_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  reviews_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'sent'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
