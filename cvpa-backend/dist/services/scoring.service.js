"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringService = void 0;
const database_1 = require("../config/database");
class ScoringService {
    async calculateScores(companyId, auditId) {
        // Get all value propositions (promises)
        const promisesResult = await database_1.pool.query('SELECT * FROM value_propositions WHERE company_id = $1', [companyId]);
        const promises = promisesResult.rows;
        // Get all customer feedback analysis (reality)
        const feedbackResult = await database_1.pool.query(`SELECT cfa.*, r.review_text, r.rating 
       FROM customer_feedback_analysis cfa
       JOIN reviews r ON r.id = cfa.review_id
       WHERE cfa.company_id = $1`, [companyId]);
        const feedback = feedbackResult.rows;
        if (feedback.length === 0) {
            throw new Error('No customer feedback available for scoring');
        }
        // Calculate dimension scores
        const jobsScore = await this.calculateJobsScore(promises, feedback);
        const painsScore = await this.calculatePainsScore(promises, feedback);
        const gainsScore = await this.calculateGainsScore(promises, feedback);
        // Calculate overall score (weighted)
        const overallScore = jobsScore * 0.4 + painsScore * 0.3 + gainsScore * 0.3;
        // Calculate statistical significance
        const sampleSize = feedback.length;
        const statisticalSignificance = this.calculateStatisticalSignificance(sampleSize);
        // Save scores
        const result = await database_1.pool.query(`INSERT INTO audit_scores 
       (company_id, audit_id, audit_date, overall_score, jobs_score, pains_score, gains_score, statistical_significance, sample_size)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8)
       RETURNING *`, [companyId, auditId, overallScore, jobsScore, painsScore, gainsScore, statisticalSignificance, sampleSize]);
        return result.rows[0];
    }
    async calculateJobsScore(promises, feedback) {
        const promisedJobs = promises.filter((p) => p.category === 'job');
        if (promisedJobs.length === 0) {
            return 50; // Neutral score if no jobs promised
        }
        let totalScore = 0;
        let totalWeight = 0;
        for (const job of promisedJobs) {
            // Find matching jobs in feedback
            let matched = 0;
            let mentions = 0;
            for (const f of feedback) {
                const jobsMentioned = f.jobs_mentioned || [];
                for (const mentionedJob of jobsMentioned) {
                    mentions++;
                    // Simple keyword matching (in production, use semantic similarity)
                    if (this.textSimilarity(job.extracted_text, mentionedJob.text) > 0.5) {
                        matched++;
                    }
                }
            }
            // Calculate fulfillment rate
            const fulfillmentRate = mentions > 0 ? matched / mentions : 0;
            const importance = mentions / feedback.length; // Frequency weight
            totalScore += fulfillmentRate * importance * 100;
            totalWeight += importance;
        }
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
    async calculatePainsScore(promises, feedback) {
        const promisedPainRelief = promises.filter((p) => p.category === 'pain');
        if (promisedPainRelief.length === 0) {
            return 50; // Neutral score
        }
        let totalScore = 0;
        let totalWeight = 0;
        for (const promise of promisedPainRelief) {
            // Check if pain is still mentioned in feedback
            let stillMentioned = 0;
            let totalMentions = 0;
            for (const f of feedback) {
                const painsMentioned = f.pains_mentioned || [];
                for (const pain of painsMentioned) {
                    totalMentions++;
                    if (this.textSimilarity(promise.extracted_text, pain.text) > 0.5) {
                        stillMentioned++;
                    }
                }
            }
            // Pain relief effectiveness (less mentions = better)
            const painReduction = totalMentions > 0 ? 1 - (stillMentioned / totalMentions) : 1;
            const importance = totalMentions / feedback.length;
            // Score: 100 if fully relieved, 0 if not relieved
            const score = painReduction > 0.5 ? 100 : painReduction * 100;
            totalScore += score * importance;
            totalWeight += importance;
        }
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
    async calculateGainsScore(promises, feedback) {
        const promisedGains = promises.filter((p) => p.category === 'gain');
        if (promisedGains.length === 0) {
            return 50; // Neutral score
        }
        let totalScore = 0;
        let totalWeight = 0;
        for (const gain of promisedGains) {
            let achieved = 0;
            let mentions = 0;
            for (const f of feedback) {
                const gainsMentioned = f.gains_mentioned || [];
                for (const mentionedGain of gainsMentioned) {
                    mentions++;
                    if (this.textSimilarity(gain.extracted_text, mentionedGain.text) > 0.5) {
                        // Check sentiment - positive sentiment means gain achieved
                        if (f.sentiment > 0.5) {
                            achieved++;
                        }
                    }
                }
            }
            const achievementRate = mentions > 0 ? achieved / mentions : 0;
            const importance = mentions / feedback.length;
            // Weight by gain type
            const typeWeight = gain.gain_type === 'required' ? 1.0 :
                gain.gain_type === 'expected' ? 0.8 :
                    gain.gain_type === 'desired' ? 0.6 : 0.4;
            totalScore += achievementRate * importance * typeWeight * 100;
            totalWeight += importance * typeWeight;
        }
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
    async identifyGaps(companyId, auditId) {
        // Get promises and reality
        const promisesResult = await database_1.pool.query('SELECT * FROM value_propositions WHERE company_id = $1', [companyId]);
        const promises = promisesResult.rows;
        const feedbackResult = await database_1.pool.query(`SELECT cfa.*, r.review_text 
       FROM customer_feedback_analysis cfa
       JOIN reviews r ON r.id = cfa.review_id
       WHERE cfa.company_id = $1`, [companyId]);
        const feedback = feedbackResult.rows;
        const gaps = [];
        // If we have low scores, create gaps based on score analysis
        const scoresResult = await database_1.pool.query('SELECT * FROM audit_scores WHERE audit_id = $1', [auditId]);
        const scores = scoresResult.rows[0];
        // Generate gaps based on low scores even if no specific promises are extracted
        if (scores) {
            if (scores.jobs_score < 60) {
                gaps.push({
                    id: '',
                    company_id: companyId,
                    audit_id: auditId,
                    gap_type: 'jobs',
                    gap_description: `Jobs Fulfillment Score is ${Math.round(scores.jobs_score)}/100 - Customers are not experiencing promised jobs to be done`,
                    gap_severity: scores.jobs_score < 40 ? 'critical' : scores.jobs_score < 50 ? 'high' : 'medium',
                    promise_text: 'Company promises to help customers accomplish specific jobs',
                    reality_text: `Only ${Math.round(scores.jobs_score)}% job fulfillment rate in customer feedback`,
                    impact_score: 100 - scores.jobs_score,
                    priority: 1,
                });
            }
            if (scores.pains_score < 60) {
                gaps.push({
                    id: '',
                    company_id: companyId,
                    audit_id: auditId,
                    gap_type: 'pains',
                    gap_description: `Pain Relief Score is ${Math.round(scores.pains_score)}/100 - Customers are still experiencing promised pain relief`,
                    gap_severity: scores.pains_score < 40 ? 'critical' : scores.pains_score < 50 ? 'high' : 'medium',
                    promise_text: 'Company promises to eliminate customer pains',
                    reality_text: `Only ${Math.round(scores.pains_score)}% pain relief effectiveness in customer feedback`,
                    impact_score: 100 - scores.pains_score,
                    priority: 2,
                });
            }
            if (scores.gains_score < 60) {
                gaps.push({
                    id: '',
                    company_id: companyId,
                    audit_id: auditId,
                    gap_type: 'gains',
                    gap_description: `Gain Achievement Score is ${Math.round(scores.gains_score)}/100 - Customers are not receiving promised gains`,
                    gap_severity: scores.gains_score < 40 ? 'critical' : scores.gains_score < 50 ? 'high' : 'medium',
                    promise_text: 'Company promises specific customer gains',
                    reality_text: `Only ${Math.round(scores.gains_score)}% gain achievement rate in customer feedback`,
                    impact_score: 100 - scores.gains_score,
                    priority: 3,
                });
            }
        }
        // Also identify specific gaps from extracted promises
        // Identify gaps in jobs
        const promisedJobs = promises.filter((p) => p.category === 'job');
        for (const job of promisedJobs) {
            const matchingFeedback = feedback.filter((f) => {
                const jobs = f.jobs_mentioned || [];
                return jobs.some((j) => this.textSimilarity(job.extracted_text, j.text) > 0.5);
            });
            if (matchingFeedback.length === 0 || matchingFeedback.length < feedback.length * 0.05) {
                // Gap: Job promised but not delivered
                gaps.push({
                    id: '',
                    company_id: companyId,
                    audit_id: auditId,
                    gap_type: 'jobs',
                    gap_description: `Promised job not being fulfilled: ${job.extracted_text}`,
                    gap_severity: this.calculateGapSeverity(matchingFeedback.length, feedback.length),
                    promise_text: job.extracted_text,
                    reality_text: 'Not mentioned in customer feedback',
                    impact_score: (1 - matchingFeedback.length / feedback.length) * 100,
                    priority: gaps.length + 1,
                });
            }
        }
        // Identify gaps in pains
        const promisedPainRelief = promises.filter((p) => p.category === 'pain');
        for (const pain of promisedPainRelief) {
            const stillExperienced = feedback.filter((f) => {
                const pains = f.pains_mentioned || [];
                return pains.some((p) => this.textSimilarity(pain.extracted_text, p.text) > 0.5);
            });
            if (stillExperienced.length > feedback.length * 0.05) {
                // Gap: Pain relief promised but pain still experienced
                gaps.push({
                    id: '',
                    company_id: companyId,
                    audit_id: auditId,
                    gap_type: 'pains',
                    gap_description: `Pain relief promised but pain still experienced: ${pain.extracted_text}`,
                    gap_severity: this.calculateGapSeverity(stillExperienced.length, feedback.length),
                    promise_text: pain.extracted_text,
                    reality_text: stillExperienced.map(f => f.review_text).slice(0, 200).join('; ') || 'Pain still mentioned in reviews',
                    impact_score: (stillExperienced.length / feedback.length) * 100,
                    priority: gaps.length + 1,
                });
            }
        }
        // Save gaps to database
        for (const gap of gaps) {
            await database_1.pool.query(`INSERT INTO gap_analysis 
         (company_id, audit_id, gap_type, gap_description, gap_severity, promise_text, reality_text, impact_score, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`, [gap.company_id, gap.audit_id, gap.gap_type, gap.gap_description, gap.gap_severity,
                gap.promise_text, gap.reality_text, gap.impact_score, gap.priority]);
        }
        console.log(`Identified ${gaps.length} gaps for audit ${auditId}`);
        return gaps;
    }
    calculateGapSeverity(frequency, total) {
        const percentage = (frequency / total) * 100;
        if (percentage >= 30)
            return 'critical';
        if (percentage >= 15)
            return 'high';
        if (percentage >= 5)
            return 'medium';
        return 'low';
    }
    calculateStatisticalSignificance(sampleSize) {
        // For 95% confidence level
        if (sampleSize >= 385)
            return 0.95;
        if (sampleSize >= 200)
            return 0.90;
        return 0.85;
    }
    textSimilarity(text1, text2) {
        // Simple similarity based on common words (for MVP)
        const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        if (words1.length === 0 || words2.length === 0)
            return 0;
        const commonWords = words1.filter(w => words2.includes(w));
        return commonWords.length / Math.max(words1.length, words2.length);
    }
}
exports.ScoringService = ScoringService;
//# sourceMappingURL=scoring.service.js.map