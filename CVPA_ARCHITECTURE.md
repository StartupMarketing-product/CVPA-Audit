# CVPA - Technical Architecture Document

## System Architecture Overview

### Architecture Pattern
**Microservices Architecture** with event-driven communication for scalability and maintainability.

### Core Principles
- **Separation of Concerns**: Each service handles one domain
- **Scalability**: Horizontal scaling per service
- **Resilience**: Circuit breakers, retries, graceful degradation
- **Observability**: Comprehensive logging, metrics, tracing
- **Security**: End-to-end encryption, authentication, authorization

---

## System Components

### 1. API Gateway
**Technology**: Kong, AWS API Gateway, or NGINX
**Responsibilities**:
- Request routing to microservices
- Authentication/authorization (JWT validation)
- Rate limiting (per user/company)
- Request/response transformation
- CORS handling
- API versioning

**Endpoints**:
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
GET    /api/v1/companies
POST   /api/v1/companies
GET    /api/v1/companies/{id}/audit
POST   /api/v1/companies/{id}/audit/start
GET    /api/v1/companies/{id}/audit/report
```

### 2. Authentication Service
**Technology**: Node.js + Express or Python + FastAPI
**Responsibilities**:
- User registration/login
- JWT token generation/validation
- Password hashing (bcrypt)
- OAuth integration (Google, GitHub)
- Role-based access control (RBAC)

**Database Schema**:
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  role VARCHAR(50), -- admin, user, viewer
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token VARCHAR(500),
  expires_at TIMESTAMP,
  created_at TIMESTAMP
)
```

### 3. Data Collector Service
**Technology**: Python (for better scraping/NLP libraries)
**Responsibilities**:
- Web scraping (company websites)
- API integrations (App Store, Google Play, review sites)
- Social media data collection
- Media article scraping
- Data normalization and validation
- Rate limiting per source

**Service Architecture**:
```
Data Collector Service
├── Scraper Manager
│   ├── Website Scraper (BeautifulSoup, Scrapy)
│   ├── App Store Scraper
│   ├── Google Play Scraper
│   ├── Review Platform Scraper (Yelp, Trustpilot)
│   └── Social Media Scraper (Twitter API, Reddit API)
├── Data Normalizer
│   └── Format converter (unified schema)
└── Data Validator
    └── Quality checks
```

**Data Schema**:
```sql
raw_data (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  source_type VARCHAR(50), -- website, app_store, google_play, review_site, social_media, media
  source_url TEXT,
  content TEXT,
  metadata JSONB,
  collected_at TIMESTAMP,
  status VARCHAR(50) -- pending, processed, failed
)

reviews (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  source VARCHAR(100),
  reviewer_name VARCHAR(255),
  rating INTEGER,
  review_text TEXT,
  review_date DATE,
  verified BOOLEAN,
  sentiment_score FLOAT,
  collected_at TIMESTAMP
)
```

### 4. NLP Analysis Service
**Technology**: Python + spaCy/Transformers
**Responsibilities**:
- Text preprocessing (cleaning, normalization)
- Sentiment analysis
- Named Entity Recognition (NER)
- Topic modeling
- Value proposition extraction
- JTBD/Pains/Gains extraction
- Keyword extraction

**ML Models**:
- **Sentiment Analysis**: Fine-tuned BERT or RoBERTa
- **Topic Modeling**: BERTopic or LDA
- **Entity Extraction**: spaCy NER + custom training
- **JTBD Extraction**: Custom fine-tuned transformer model

**Processing Pipeline**:
```
Raw Text
  ↓
Preprocessing (tokenization, cleaning)
  ↓
Sentiment Analysis
  ↓
Entity Extraction (company names, products, features)
  ↓
Topic Modeling (themes)
  ↓
JTBD/Pains/Gains Classification
  ↓
Structured Output (JSON)
```

**Output Schema**:
```json
{
  "document_id": "uuid",
  "sentiment": {
    "label": "positive|negative|neutral",
    "score": 0.85
  },
  "entities": [
    {
      "text": "customer support",
      "label": "FEATURE",
      "confidence": 0.92
    }
  ],
  "topics": [
    {
      "topic_id": 1,
      "keywords": ["support", "response", "help"],
      "weight": 0.35
    }
  ],
  "jobs_to_be_done": [
    {
      "job": "Get quick response to support questions",
      "type": "functional",
      "confidence": 0.88
    }
  ],
  "customer_pains": [
    {
      "pain": "Long wait times for support",
      "severity": "high",
      "frequency": 0.45
    }
  ],
  "customer_gains": [
    {
      "gain": "Fast response time",
      "type": "expected",
      "frequency": 0.32
    }
  ]
}
```

### 5. Scoring Service
**Technology**: Python or Node.js
**Responsibilities**:
- Calculate alignment scores
- Gap analysis computation
- Trend analysis
- Statistical significance calculation
- Score aggregation

**Scoring Algorithm**:

```python
def calculate_alignment_score(company_id, time_period):
    # Get promises (from company communications)
    promises = get_promises(company_id, time_period)
    
    # Get reality (from customer reviews)
    reality = get_reality(company_id, time_period)
    
    # Calculate dimension scores
    jobs_score = calculate_jobs_score(promises.jobs, reality.jobs)
    pains_score = calculate_pains_score(promises.pains, reality.pains)
    gains_score = calculate_gains_score(promises.gains, reality.gains)
    
    # Weighted overall score
    overall_score = (
        jobs_score * 0.4 +
        pains_score * 0.3 +
        gains_score * 0.3
    )
    
    # Calculate gaps
    gaps = identify_gaps(promises, reality)
    
    return {
        "overall_score": overall_score,
        "dimension_scores": {
            "jobs": jobs_score,
            "pains": pains_score,
            "gains": gains_score
        },
        "gaps": gaps
    }

def calculate_jobs_score(promised_jobs, delivered_jobs):
    # Match promised jobs with delivered jobs
    matches = match_jobs(promised_jobs, delivered_jobs)
    
    # Calculate fulfillment rate
    fulfillment_rate = len(matches) / len(promised_jobs) if promised_jobs else 0
    
    # Weight by importance (from customer feedback frequency)
    weighted_score = sum(
        match.confidence * match.importance 
        for match in matches
    ) / sum(job.importance for job in promised_jobs) if promised_jobs else 0
    
    return weighted_score * 100
```

**Database Schema**:
```sql
audit_scores (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  audit_date DATE,
  overall_score FLOAT,
  jobs_score FLOAT,
  pains_score FLOAT,
  gains_score FLOAT,
  statistical_significance FLOAT,
  sample_size INTEGER,
  created_at TIMESTAMP
)

gap_analysis (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  audit_id UUID REFERENCES audit_scores(id),
  gap_type VARCHAR(50), -- jobs, pains, gains
  gap_description TEXT,
  gap_severity VARCHAR(20), -- low, medium, high, critical
  promise_text TEXT,
  reality_text TEXT,
  impact_score FLOAT,
  priority INTEGER
)
```

### 6. Report Generation Service
**Technology**: Node.js (for PDF generation) or Python (ReportLab/WeasyPrint)
**Responsibilities**:
- Generate PDF reports
- Create visualizations (charts, graphs)
- Compile executive summaries
- Export data (CSV, JSON, Excel)

**Report Structure**:
1. Executive Summary
2. Overall Score Dashboard
3. Dimension Scores (Jobs, Pains, Gains)
4. Gap Analysis
5. Top Strengths
6. Top Weaknesses
7. Recommendations
8. Risk Analysis
9. Appendices (data sources, methodology)

### 7. Recommendation Engine
**Technology**: Python (ML-based) or Rule-based
**Responsibilities**:
- Generate action plans based on gaps
- Prioritize recommendations
- Estimate impact and effort
- Suggest timeline

**Recommendation Types**:
- **Quick Wins**: High impact, low effort
- **Strategic Initiatives**: High impact, high effort
- **Maintenance**: Low impact, low effort (for good alignment)

---

## Data Flow

### Audit Execution Flow

```
1. User initiates audit
   ↓
2. API Gateway → Audit Service
   ↓
3. Audit Service → Data Collector Service
   ↓
4. Data Collector fetches data from multiple sources
   (async, queue-based)
   ↓
5. Raw data stored in database
   ↓
6. Data Collector → Message Queue (job completion event)
   ↓
7. NLP Service processes raw data
   (extracts promises & reality)
   ↓
8. Processed data stored in database
   ↓
9. NLP Service → Message Queue (processing complete)
   ↓
10. Scoring Service calculates scores
    ↓
11. Gap Analysis Service identifies gaps
    ↓
12. Recommendation Engine generates action plan
    ↓
13. Report Service generates PDF report
    ↓
14. User notified (email/webhook)
    ↓
15. Results available in dashboard
```

### Real-time Data Collection Flow

```
Scheduler (Cron job)
  ↓
Data Collector Service (periodic)
  ↓
Fetch from external sources
  ↓
Store raw data
  ↓
Trigger NLP processing
  ↓
Update scores (if significant change)
  ↓
Notify users (if configured)
```

---

## Database Design

### Core Tables

```sql
-- Companies
companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  industry VARCHAR(100),
  website_url TEXT,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID REFERENCES users(id)
)

-- Audits
audits (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  status VARCHAR(50), -- pending, collecting, analyzing, completed, failed
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  time_period_start DATE,
  time_period_end DATE,
  created_at TIMESTAMP
)

-- Value Propositions (from company communications)
value_propositions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  source_type VARCHAR(50),
  source_url TEXT,
  extracted_text TEXT,
  category VARCHAR(50), -- job, pain, gain
  job_type VARCHAR(50), -- functional, emotional, social (if category=job)
  gain_type VARCHAR(50), -- required, expected, desired, unexpected (if category=gain)
  confidence FLOAT,
  extracted_at TIMESTAMP
)

-- Customer Feedback Analysis
customer_feedback_analysis (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  review_id UUID REFERENCES reviews(id),
  jobs_mentioned JSONB,
  pains_mentioned JSONB,
  gains_mentioned JSONB,
  sentiment FLOAT,
  topics JSONB,
  analyzed_at TIMESTAMP
)

-- Recommendations
recommendations (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  audit_id UUID REFERENCES audits(id),
  gap_id UUID REFERENCES gap_analysis(id),
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(50), -- quick_win, strategic, maintenance
  priority INTEGER,
  estimated_impact FLOAT,
  estimated_effort VARCHAR(20), -- low, medium, high
  timeline VARCHAR(100),
  status VARCHAR(50), -- pending, in_progress, completed
  created_at TIMESTAMP
)
```

---

## API Specifications

### REST API Endpoints

#### Authentication
```
POST   /api/v1/auth/register
Body: { email, password, name }

POST   /api/v1/auth/login
Body: { email, password }
Response: { token, refresh_token, user }

POST   /api/v1/auth/refresh
Body: { refresh_token }
Response: { token }
```

#### Companies
```
GET    /api/v1/companies
Query: ?page=1&limit=10
Response: { companies: [...], total, page, limit }

POST   /api/v1/companies
Body: { name, industry, website_url, description }

GET    /api/v1/companies/{id}
Response: { company, latest_audit, score }

PUT    /api/v1/companies/{id}
Body: { name?, industry?, website_url?, description? }

DELETE /api/v1/companies/{id}
```

#### Audits
```
POST   /api/v1/companies/{id}/audits
Body: { time_period_start, time_period_end, sources: [...] }
Response: { audit_id, status }

GET    /api/v1/companies/{id}/audits
Query: ?status=completed&limit=10

GET    /api/v1/audits/{id}
Response: { audit, status, progress, scores, gaps, recommendations }

GET    /api/v1/audits/{id}/report
Response: PDF file or JSON report data
```

#### Data Sources
```
GET    /api/v1/companies/{id}/data-sources
Response: { sources: [{ type, status, last_sync, record_count }] }

POST   /api/v1/companies/{id}/data-sources/sync
Body: { source_types: [...] }
Response: { job_id, status }
```

---

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Short-lived access tokens (15 min) + refresh tokens (7 days)
- **OAuth 2.0**: For third-party integrations
- **RBAC**: Role-based access control (admin, user, viewer)
- **API Keys**: For programmatic access (enterprise)

### Data Security
- **Encryption at Rest**: AES-256 for databases
- **Encryption in Transit**: TLS 1.3 for all communications
- **PII Handling**: Pseudonymization of reviewer names
- **Data Retention**: Configurable retention policies

### Security Measures
- **Rate Limiting**: Per user/IP/endpoint
- **Input Validation**: Sanitization of all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Content Security Policy
- **CORS**: Restricted origins
- **Audit Logging**: All actions logged

---

## Deployment Architecture

### Development Environment
```
Docker Compose Setup:
- PostgreSQL
- Redis
- Elasticsearch
- All microservices (local)
- API Gateway (Kong or NGINX)
```

### Production Environment (AWS)
```
┌─────────────────────────────────────────┐
│         CloudFront (CDN)                │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│      Application Load Balancer          │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│      ECS/EKS Cluster                    │
│  ┌──────────┐  ┌──────────┐            │
│  │ API      │  │ Auth     │            │
│  │ Gateway  │  │ Service  │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │ Data     │  │ NLP      │            │
│  │ Collector│  │ Service  │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │ Scoring  │  │ Report   │            │
│  │ Service  │  │ Service  │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│      RDS (PostgreSQL)                   │
│      ElastiCache (Redis)                │
│      Elasticsearch Service              │
│      S3 (File Storage)                  │
└─────────────────────────────────────────┘
```

---

## Monitoring & Observability

### Logging
- **Centralized Logging**: ELK Stack or CloudWatch
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Structured Logging**: JSON format
- **Correlation IDs**: Track requests across services

### Metrics
- **Application Metrics**: Prometheus
- **Key Metrics**:
  - Request rate, latency, error rate
  - Data collection success rate
  - NLP processing time
  - Score calculation time
- **Dashboards**: Grafana

### Tracing
- **Distributed Tracing**: Jaeger or AWS X-Ray
- **Request Tracing**: Track requests across microservices

### Alerts
- **Critical Alerts**: Service downtime, high error rate
- **Warning Alerts**: Slow performance, high latency
- **Info Alerts**: Data collection failures, low scores

---

## Scaling Strategy

### Horizontal Scaling
- **Stateless Services**: All services designed to be stateless
- **Auto-scaling**: Based on CPU/memory/queue depth
- **Load Balancing**: Round-robin or least connections

### Database Scaling
- **Read Replicas**: For read-heavy operations
- **Connection Pooling**: pgBouncer for PostgreSQL
- **Caching**: Redis for frequently accessed data
- **Partitioning**: Time-based partitioning for large tables

### Processing Scaling
- **Message Queues**: RabbitMQ or AWS SQS for async processing
- **Workers**: Horizontal scaling of worker processes
- **Batch Processing**: Apache Spark for large data processing (future)

---

## Cost Optimization

### Infrastructure Costs
- **Reserved Instances**: For predictable workloads
- **Spot Instances**: For batch processing jobs
- **Auto-scaling**: Scale down during low usage
- **CDN**: CloudFront for static assets

### API Costs
- **Caching**: Aggressive caching to reduce API calls
- **Rate Limiting**: Respectful rate limiting
- **Batch Requests**: Where possible, batch API calls

### Storage Costs
- **Lifecycle Policies**: Archive old data to cheaper storage
- **Compression**: Compress stored data
- **Deduplication**: Avoid storing duplicate reviews

---

## Future Enhancements

1. **Real-time Streaming**: Kafka for real-time data processing
2. **ML Model Serving**: Dedicated ML serving infrastructure (Seldon, MLflow)
3. **Multi-tenancy**: Support for SaaS model
4. **Advanced Analytics**: Time-series forecasting, predictive analytics
5. **Competitive Intelligence**: Compare multiple companies
6. **API Marketplace**: Allow third-party integrations

