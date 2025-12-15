-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  website_url TEXT,
  description TEXT,
  app_store_id VARCHAR(50),
  google_play_package VARCHAR(200),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audits table
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'collecting', 'analyzing', 'completed', 'failed')),
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  time_period_start DATE NOT NULL,
  time_period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raw data table
CREATE TABLE IF NOT EXISTS raw_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('website', 'app_store', 'google_play', 'review_site', 'social_media', 'media', 'yandex_maps', 'uzum')),
  source_url TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed'))
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  source VARCHAR(100) NOT NULL,
  reviewer_name VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  review_date DATE,
  verified BOOLEAN DEFAULT false,
  sentiment_score FLOAT,
  collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Value propositions table
CREATE TABLE IF NOT EXISTS value_propositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  source_url TEXT,
  extracted_text TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('job', 'pain', 'gain')),
  job_type VARCHAR(50) CHECK (job_type IN ('functional', 'emotional', 'social')),
  gain_type VARCHAR(50) CHECK (gain_type IN ('required', 'expected', 'desired', 'unexpected')),
  confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer feedback analysis table
CREATE TABLE IF NOT EXISTS customer_feedback_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  jobs_mentioned JSONB DEFAULT '[]',
  pains_mentioned JSONB DEFAULT '[]',
  gains_mentioned JSONB DEFAULT '[]',
  sentiment FLOAT,
  topics JSONB DEFAULT '[]',
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit scores table
CREATE TABLE IF NOT EXISTS audit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  audit_date DATE DEFAULT CURRENT_DATE,
  overall_score FLOAT CHECK (overall_score >= 0 AND overall_score <= 100),
  jobs_score FLOAT CHECK (jobs_score >= 0 AND jobs_score <= 100),
  pains_score FLOAT CHECK (pains_score >= 0 AND pains_score <= 100),
  gains_score FLOAT CHECK (gains_score >= 0 AND gains_score <= 100),
  statistical_significance FLOAT,
  sample_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gap analysis table
CREATE TABLE IF NOT EXISTS gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  gap_type VARCHAR(50) CHECK (gap_type IN ('jobs', 'pains', 'gains')),
  gap_description TEXT NOT NULL,
  gap_severity VARCHAR(20) CHECK (gap_severity IN ('low', 'medium', 'high', 'critical')),
  promise_text TEXT,
  reality_text TEXT,
  impact_score FLOAT,
  priority INTEGER
);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  gap_id UUID REFERENCES gap_analysis(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN ('quick_win', 'strategic', 'maintenance')),
  priority INTEGER,
  estimated_impact FLOAT,
  estimated_effort VARCHAR(20) CHECK (estimated_effort IN ('low', 'medium', 'high')),
  timeline VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_audits_company_id ON audits(company_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_raw_data_company_id ON raw_data(company_id);
CREATE INDEX IF NOT EXISTS idx_raw_data_status ON raw_data(status);
CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(source);
CREATE INDEX IF NOT EXISTS idx_value_propositions_company_id ON value_propositions(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_scores_company_id ON audit_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_scores_audit_id ON audit_scores(audit_id);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_company_id ON gap_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_company_id ON recommendations(company_id);

