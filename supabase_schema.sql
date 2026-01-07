-- ============================================
-- GRAHA KITA - DATABASE SCHEMA MIGRATION
-- Supabase Project: ixjechujsfqirldapwan
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT,
  location TEXT,
  organizer TEXT,
  target_amount NUMERIC DEFAULT 0,
  raised_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  category TEXT,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. DONATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  message TEXT,
  channel TEXT DEFAULT 'qris',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  midtrans_order_id TEXT,
  midtrans_transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. ARTICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  cover_url TEXT,
  content_html TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. PARTNERSHIP LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partnership_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  interested_tier TEXT,
  monthly_budget TEXT,
  message TEXT,
  agree_terms BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'proposal', 'won', 'lost')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. STORIES TABLE (Kisah Harapan)
-- ============================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. GALLERIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS galleries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. PAGES TABLE (Halaman Statis)
-- ============================================
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content_html TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. SITE CONTENT TABLE (Dynamic Content)
-- ============================================
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ policies (for published content)
CREATE POLICY "Public can read published campaigns" ON campaigns
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read published articles" ON articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read published pages" ON pages
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read published stories" ON stories
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read galleries" ON galleries
  FOR SELECT USING (true);

CREATE POLICY "Public can read site_content" ON site_content
  FOR SELECT USING (true);

-- PUBLIC INSERT policies
CREATE POLICY "Public can create donations" ON donations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can create partnership_leads" ON partnership_leads
  FOR INSERT WITH CHECK (true);

-- AUTHENTICATED (Admin) policies - full access
CREATE POLICY "Authenticated users have full access to campaigns" ON campaigns
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to donations" ON donations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to articles" ON articles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to partnership_leads" ON partnership_leads
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to stories" ON stories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to galleries" ON galleries
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to pages" ON pages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to site_content" ON site_content
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- INITIAL DATA (Optional sample data)
-- ============================================

-- Insert default site_content
INSERT INTO site_content (key, data) VALUES
  ('home', '{"header": {"title": "Graha Kita", "tagline": "Kebaikan Anda, Kekuatan Mereka"}, "hero": {"title": "Kebaikan Anda, Kekuatan Mereka", "subtitle": "Platform donasi untuk membantu sesama"}}'),
  ('footer', '{"copyright": "2024 Graha Kita. All rights reserved.", "social": {"whatsapp": "6282122288900"}}'),
  ('contact', '{"phone": "0821-2228-8900", "email": "info@grahakita.com", "address": "Jakarta, Indonesia"}')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- DONE!
-- ============================================
