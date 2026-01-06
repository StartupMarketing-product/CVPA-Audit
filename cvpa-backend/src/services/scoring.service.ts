import { pool } from '../config/database';
import { AuditScore, GapAnalysis } from '../types';

export class ScoringService {
  async calculateScores(companyId: string, auditId: string): Promise<AuditScore> {
    // Get all value propositions (promises)
    const promisesResult = await pool.query(
      'SELECT * FROM value_propositions WHERE company_id = $1',
      [companyId]
    );
    const promises = promisesResult.rows;

    // Get all customer feedback analysis (reality)
    const feedbackResult = await pool.query(
      `SELECT cfa.*, r.review_text, r.rating 
       FROM customer_feedback_analysis cfa
       JOIN reviews r ON r.id = cfa.review_id
       WHERE cfa.company_id = $1`,
      [companyId]
    );
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
    const result = await pool.query(
      `INSERT INTO audit_scores 
       (company_id, audit_id, audit_date, overall_score, jobs_score, pains_score, gains_score, statistical_significance, sample_size)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [companyId, auditId, overallScore, jobsScore, painsScore, gainsScore, statisticalSignificance, sampleSize]
    );

    return result.rows[0];
  }

  private async calculateJobsScore(promises: any[], feedback: any[]): Promise<number> {
    const promisedJobs = promises.filter(p => p.category === 'job');
    
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

  private async calculatePainsScore(promises: any[], feedback: any[]): Promise<number> {
    const promisedPainRelief = promises.filter(p => p.category === 'pain');
    
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

  private async calculateGainsScore(promises: any[], feedback: any[]): Promise<number> {
    const promisedGains = promises.filter(p => p.category === 'gain');
    
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

  async identifyGaps(companyId: string, auditId: string): Promise<GapAnalysis[]> {
    try {
      console.log(`Starting gap identification for audit ${auditId}, company ${companyId}`);
      
      // Get promises and reality
    const promisesResult = await pool.query(
      'SELECT * FROM value_propositions WHERE company_id = $1',
      [companyId]
    );
    const promises = promisesResult.rows;
    console.log(`Found ${promises.length} value propositions`);

    const feedbackResult = await pool.query(
      `SELECT cfa.*, r.review_text 
       FROM customer_feedback_analysis cfa
       JOIN reviews r ON r.id = cfa.review_id
       WHERE cfa.company_id = $1`,
      [companyId]
    );
    const feedback = feedbackResult.rows;
    console.log(`Found ${feedback.length} feedback items`);

    const gaps: GapAnalysis[] = [];

    // If we have low scores, create gaps based on score analysis
    const scoresResult = await pool.query(
      'SELECT * FROM audit_scores WHERE audit_id = $1',
      [auditId]
    );
    const scores = scoresResult.rows[0];
    console.log(`Audit scores:`, scores ? {
      jobs: scores.jobs_score,
      pains: scores.pains_score,
      gains: scores.gains_score,
      overall: scores.overall_score
    } : 'No scores found');

    // Generate gaps based on low scores even if no specific promises are extracted
    if (scores) {
      if (scores.jobs_score != null && scores.jobs_score < 60) {
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

      if (scores.pains_score != null && scores.pains_score < 60) {
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

      if (scores.gains_score != null && scores.gains_score < 60) {
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

    // Identify specific gaps from extracted promises - one gap per promise
    // Process all promises and create gaps for those with low fulfillment
    const allPromises = promises.filter(p => ['job', 'pain', 'gain'].includes(p.category));
    
    for (const promise of allPromises) {
      const category = promise.category as 'job' | 'pain' | 'gain';
      const stats = this.calculatePromiseStatistics(promise, feedback, category);
      
      // Create gap if fulfillment rate < 30% or sentiment < 0.4
      const shouldCreateGap = stats.fulfillmentRate < 0.3 || stats.averageSentiment < 0.4;
      
      if (shouldCreateGap) {
        // Determine gap type mapping
        const gapTypeMap: { [key: string]: 'jobs' | 'pains' | 'gains' } = {
          'job': 'jobs',
          'pain': 'pains',
          'gain': 'gains',
        };
        const gapType = gapTypeMap[category] || 'jobs';
        
        // Create gap description based on category
        let gapDescription = '';
        if (category === 'job') {
          gapDescription = `Promised job not being fulfilled: ${promise.extracted_text}`;
        } else if (category === 'pain') {
          gapDescription = `Pain relief promised but pain still experienced: ${promise.extracted_text}`;
        } else {
          gapDescription = `Promised gain not achieved: ${promise.extracted_text}`;
        }
        
        // Create reality text with aggregated statistics
        const realityText = `${stats.mentionPercentage}% of reviews mention this. Average sentiment: ${stats.averageSentiment.toFixed(2)}/1.0. Fulfillment rate: ${(stats.fulfillmentRate * 100).toFixed(1)}%`;
        
        gaps.push({
          id: '',
          company_id: companyId,
          audit_id: auditId,
          gap_type: gapType,
          gap_description: gapDescription,
          gap_severity: this.calculateGapSeverity(stats.mentionCount, feedback.length),
          promise_text: promise.extracted_text,
          reality_text: realityText,
          impact_score: (1 - stats.fulfillmentRate) * 100,
          priority: gaps.length + 1,
        });
      }
    }

    // Delete existing gaps for this audit to avoid duplicates
    await pool.query(
      'DELETE FROM gap_analysis WHERE audit_id = $1',
      [auditId]
    );

    // Save gaps to database and collect inserted gaps with IDs
    const insertedGaps: GapAnalysis[] = [];
    for (const gap of gaps) {
      try {
        const result = await pool.query(
          `INSERT INTO gap_analysis 
           (company_id, audit_id, gap_type, gap_description, gap_severity, promise_text, reality_text, impact_score, priority)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [gap.company_id, gap.audit_id, gap.gap_type, gap.gap_description, gap.gap_severity, 
           gap.promise_text, gap.reality_text, gap.impact_score, gap.priority]
        );
        insertedGaps.push(result.rows[0]);
      } catch (error) {
        console.error(`Error inserting gap:`, error);
        // Continue with other gaps even if one fails
      }
    }

      console.log(`Identified and saved ${insertedGaps.length} gaps for audit ${auditId}`);
      console.log(`Created ${gaps.length} gaps based on scores (before saving)`);
      if (insertedGaps.length === 0) {
        console.warn(`WARNING: No gaps were created for audit ${auditId}. Scores:`, scores ? {
          jobs: scores.jobs_score,
          pains: scores.pains_score,
          gains: scores.gains_score
        } : 'No scores');
      }
      return insertedGaps;
    } catch (error: any) {
      console.error(`Error in identifyGaps for audit ${auditId}:`, error);
      console.error('Error stack:', error.stack);
      // Return empty array instead of crashing
      return [];
    }
  }

  /**
   * Calculate aggregated statistics for a specific promise
   * Returns mention rate, average sentiment, fulfillment rate, and matching feedback
   */
  calculatePromiseStatistics(
    promise: any,
    feedback: any[],
    category: 'job' | 'pain' | 'gain'
  ): {
    mentionCount: number;
    mentionPercentage: number;
    averageSentiment: number;
    fulfillmentRate: number;
    matchingFeedback: any[];
  } {
    const matchingFeedback: any[] = [];
    
    for (const f of feedback) {
      let items: any[] = [];
      try {
        // Parse JSON fields if they're strings
        if (category === 'job') {
          items = typeof f.jobs_mentioned === 'string' 
            ? JSON.parse(f.jobs_mentioned) 
            : (f.jobs_mentioned || []);
        } else if (category === 'pain') {
          items = typeof f.pains_mentioned === 'string' 
            ? JSON.parse(f.pains_mentioned) 
            : (f.pains_mentioned || []);
        } else if (category === 'gain') {
          items = typeof f.gains_mentioned === 'string' 
            ? JSON.parse(f.gains_mentioned) 
            : (f.gains_mentioned || []);
        }
      } catch (e) {
        items = [];
      }

      // Check if this feedback mentions the promise
      const mentionsPromise = items.some((item: any) => {
        const similarity = this.textSimilarity(promise.extracted_text, item.text || '');
        return similarity > 0.5;
      });

      if (mentionsPromise) {
        matchingFeedback.push(f);
      }
    }

    const mentionCount = matchingFeedback.length;
    const totalReviews = feedback.length;
    const mentionPercentage = totalReviews > 0 ? (mentionCount / totalReviews) * 100 : 0;

    // Calculate average sentiment
    const averageSentiment = matchingFeedback.length > 0
      ? matchingFeedback.reduce((sum, f) => sum + (f.sentiment || 0.5), 0) / matchingFeedback.length
      : 0.5;

    // Calculate fulfillment rate based on category
    let fulfillmentRate = 0;
    if (category === 'job') {
      // For jobs: fulfillment = percentage of reviews that mention the job
      fulfillmentRate = mentionPercentage / 100;
    } else if (category === 'pain') {
      // For pains: fulfillment = inverse of mention rate (less mentions = better)
      fulfillmentRate = 1 - (mentionPercentage / 100);
    } else if (category === 'gain') {
      // For gains: fulfillment = percentage of mentions with positive sentiment
      const positiveMentions = matchingFeedback.filter(f => (f.sentiment || 0.5) > 0.5).length;
      fulfillmentRate = mentionCount > 0 ? positiveMentions / mentionCount : 0;
    }

    return {
      mentionCount,
      mentionPercentage: Math.round(mentionPercentage * 10) / 10, // Round to 1 decimal
      averageSentiment: Math.round(averageSentiment * 100) / 100, // Round to 2 decimals
      fulfillmentRate: Math.round(fulfillmentRate * 100) / 100, // Round to 2 decimals
      matchingFeedback,
    };
  }

  private calculateGapSeverity(frequency: number, total: number): 'low' | 'medium' | 'high' | 'critical' {
    const percentage = (frequency / total) * 100;
    if (percentage >= 30) return 'critical';
    if (percentage >= 15) return 'high';
    if (percentage >= 5) return 'medium';
    return 'low';
  }

  private calculateStatisticalSignificance(sampleSize: number): number {
    // For 95% confidence level
    if (sampleSize >= 385) return 0.95;
    if (sampleSize >= 200) return 0.90;
    return 0.85;
  }

  private textSimilarity(text1: string, text2: string): number {
    // Simple similarity based on common words (for MVP)
    const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    
    if (words1.length === 0 || words2.length === 0) return 0;

    const commonWords = words1.filter(w => words2.includes(w));
    return commonWords.length / Math.max(words1.length, words2.length);
  }
}

