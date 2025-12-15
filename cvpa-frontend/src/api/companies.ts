import apiClient from './client';

export interface Company {
  id: string;
  name: string;
  industry: string;
  website_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Audit {
  id: string;
  company_id: string;
  status: 'pending' | 'collecting' | 'analyzing' | 'completed' | 'failed';
  start_date: string;
  end_date?: string;
  time_period_start: string;
  time_period_end: string;
  created_at: string;
}

export interface AuditScore {
  id: string;
  overall_score: number;
  jobs_score: number;
  pains_score: number;
  gains_score: number;
  statistical_significance: number;
  sample_size: number;
}

export interface PromisePoint {
  text: string;
  source_type?: string;
  source_url?: string;
  confidence?: number;
  job_type?: string;
  gain_type?: string;
}

export interface RealityPoint {
  text: string;
  rating?: number;
  source?: string;
  sentiment?: number;
  date?: string;
  issue?: string;
}

export interface GapAnalysis {
  id: string;
  gap_type: 'jobs' | 'pains' | 'gains';
  gap_description: string;
  gap_severity: 'low' | 'medium' | 'high' | 'critical';
  promise_text: string;
  reality_text: string;
  impact_score: number;
  detailed_promises?: PromisePoint[];
  detailed_reality?: RealityPoint[];
}

export const companiesApi = {
  getAll: async (): Promise<Company[]> => {
    const response = await apiClient.get('/companies');
    return response.data.companies;
  },

  getOne: async (id: string): Promise<{ company: Company; latest_score: AuditScore | null }> => {
    const response = await apiClient.get(`/companies/${id}`);
    return response.data;
  },

  create: async (data: { name: string; industry: string; website_url?: string; description?: string; app_store_id?: string; google_play_package?: string }): Promise<Company> => {
    const response = await apiClient.post('/companies', data);
    return response.data.company;
  },

  startAudit: async (companyId: string, data: {
    time_period_start: string;
    time_period_end: string;
    sources: string[];
  }): Promise<{ audit: Audit; message: string }> => {
    const response = await apiClient.post(`/companies/${companyId}/audits`, data);
    return response.data;
  },

  getAudit: async (companyId: string, auditId: string): Promise<{
    audit: Audit;
    scores: AuditScore | null;
    gaps: GapAnalysis[];
  }> => {
    const response = await apiClient.get(`/companies/${companyId}/audits/${auditId}`);
    return response.data;
  },

  getDetailedAudit: async (companyId: string, auditId: string): Promise<{
    audit: Audit;
    scores: AuditScore | null;
    dimensions: {
      jobs_fulfillment: { score: number; key_points: any[] };
      pain_relief: { score: number; key_points: any[] };
      gain_achievement: { score: number; key_points: any[] };
    };
  }> => {
    const response = await apiClient.get(`/companies/${companyId}/audits/${auditId}/detailed`);
    return response.data;
  },

  getDataSources: async (companyId: string): Promise<{
    review_sources: Array<{
      source: string;
      count: number;
      verified_count: number;
      avg_rating: string | null;
      earliest_review: string | null;
      latest_review: string | null;
    }>;
    raw_data_sources: Array<{
      source_type: string;
      count: number;
      processed_count: number;
      failed_count: number;
    }>;
    totals: {
      total_reviews: number;
      unique_sources: number;
      overall_avg_rating: string | null;
      total_verified: number;
    };
  }> => {
    const response = await apiClient.get(`/companies/${companyId}/data-sources`);
    return response.data;
  },
};

