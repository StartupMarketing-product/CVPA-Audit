export interface User {
    id: string;
    email: string;
    name: string;
    password_hash: string;
    role: 'admin' | 'user' | 'viewer';
    created_at: Date;
    updated_at: Date;
}
export interface Company {
    id: string;
    name: string;
    industry: string;
    website_url: string;
    description?: string;
    app_store_id?: string;
    google_play_package?: string;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface Audit {
    id: string;
    company_id: string;
    status: 'pending' | 'collecting' | 'analyzing' | 'completed' | 'failed';
    start_date: Date;
    end_date?: Date;
    time_period_start: Date;
    time_period_end: Date;
    created_at: Date;
}
export interface RawData {
    id: string;
    company_id: string;
    source_type: 'website' | 'app_store' | 'google_play' | 'review_site' | 'social_media' | 'media' | 'yandex_maps' | 'uzum';
    source_url: string;
    content: string;
    metadata: Record<string, any>;
    collected_at: Date;
    status: 'pending' | 'processed' | 'failed';
}
export interface Review {
    id: string;
    company_id: string;
    source: string;
    reviewer_name?: string;
    rating?: number;
    review_text: string;
    review_date: Date;
    verified: boolean;
    sentiment_score?: number;
    collected_at: Date;
}
export interface ValueProposition {
    id: string;
    company_id: string;
    source_type: string;
    source_url: string;
    extracted_text: string;
    category: 'job' | 'pain' | 'gain';
    job_type?: 'functional' | 'emotional' | 'social';
    gain_type?: 'required' | 'expected' | 'desired' | 'unexpected';
    confidence: number;
    extracted_at: Date;
}
export interface CustomerFeedbackAnalysis {
    id: string;
    company_id: string;
    review_id: string;
    jobs_mentioned: any[];
    pains_mentioned: any[];
    gains_mentioned: any[];
    sentiment: number;
    topics: any[];
    analyzed_at: Date;
}
export interface AuditScore {
    id: string;
    company_id: string;
    audit_id: string;
    audit_date: Date;
    overall_score: number;
    jobs_score: number;
    pains_score: number;
    gains_score: number;
    statistical_significance: number;
    sample_size: number;
    created_at: Date;
}
export interface GapAnalysis {
    id: string;
    company_id: string;
    audit_id: string;
    gap_type: 'jobs' | 'pains' | 'gains';
    gap_description: string;
    gap_severity: 'low' | 'medium' | 'high' | 'critical';
    promise_text: string;
    reality_text: string;
    impact_score: number;
    priority: number;
}
export interface Recommendation {
    id: string;
    company_id: string;
    audit_id: string;
    gap_id?: string;
    title: string;
    description: string;
    category: 'quick_win' | 'strategic' | 'maintenance';
    priority: number;
    estimated_impact: number;
    estimated_effort: 'low' | 'medium' | 'high';
    timeline: string;
    status: 'pending' | 'in_progress' | 'completed';
    created_at: Date;
}
//# sourceMappingURL=index.d.ts.map