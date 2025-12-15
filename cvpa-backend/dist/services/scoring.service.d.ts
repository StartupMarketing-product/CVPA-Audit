import { AuditScore, GapAnalysis } from '../types';
export declare class ScoringService {
    calculateScores(companyId: string, auditId: string): Promise<AuditScore>;
    private calculateJobsScore;
    private calculatePainsScore;
    private calculateGainsScore;
    identifyGaps(companyId: string, auditId: string): Promise<GapAnalysis[]>;
    private calculateGapSeverity;
    private calculateStatisticalSignificance;
    private textSimilarity;
}
//# sourceMappingURL=scoring.service.d.ts.map