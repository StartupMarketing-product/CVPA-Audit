import { Review, ValueProposition, CustomerFeedbackAnalysis } from '../types';
export declare class NLPService {
    analyzeSentiment(text: string): number;
    extractJobs(text: string): Array<{
        text: string;
        type: string;
        confidence: number;
    }>;
    extractPains(text: string): Array<{
        text: string;
        severity: string;
        confidence: number;
    }>;
    extractGains(text: string): Array<{
        text: string;
        type: string;
        confidence: number;
    }>;
    analyzeReview(review: Review): CustomerFeedbackAnalysis;
    extractValuePropositions(text: string, sourceType: string, sourceUrl: string, companyId: string): ValueProposition[];
}
//# sourceMappingURL=nlp.service.d.ts.map