import express from 'express';
import { pool } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { DataCollectorService } from '../services/data-collector.service';
import { NLPService } from '../services/nlp.service';
import { ScoringService } from '../services/scoring.service';

const router = express.Router();
const dataCollector = new DataCollectorService();
const nlpService = new NLPService();
const scoringService = new ScoringService();

// Get all companies
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM companies WHERE created_by = $1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json({ companies: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single company
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1 AND created_by = $2', 
      [req.params.id, req.user!.id]);
    
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get latest audit score
    const scoreResult = await pool.query(
      `SELECT * FROM audit_scores 
       WHERE company_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [req.params.id]
    );

    res.json({
      company: companyResult.rows[0],
      latest_score: scoreResult.rows[0] || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

  // Create company
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, industry, website_url, description, app_store_id, google_play_package } = req.body;

    if (!name || !industry) {
      return res.status(400).json({ error: 'Name and industry are required' });
    }

    const result = await pool.query(
      `INSERT INTO companies (name, industry, website_url, description, app_store_id, google_play_package, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, industry, website_url || null, description || null, app_store_id || null, google_play_package || null, req.user!.id]
    );

    res.status(201).json({ company: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start audit
router.post('/:id/audits', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { time_period_start, time_period_end, sources } = req.body;
    const companyId = req.params.id;

    // Verify company ownership
    const companyCheck = await pool.query(
      'SELECT id FROM companies WHERE id = $1 AND created_by = $2',
      [companyId, req.user!.id]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Create audit record
    const auditResult = await pool.query(
      `INSERT INTO audits (company_id, status, time_period_start, time_period_end)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [companyId, 'collecting', time_period_start, time_period_end]
    );

    const audit = auditResult.rows[0];

    // Start data collection (async - in production, use a queue)
    (async () => {
      try {
        // Collect website data
        if (sources.includes('website')) {
          const companyResult = await pool.query('SELECT website_url FROM companies WHERE id = $1', [companyId]);
          if (companyResult.rows[0]?.website_url) {
            await dataCollector.scrapeWebsite(companyResult.rows[0].website_url, companyId);
          }
        }

        // Collect reviews
        if (sources.includes('app_store')) {
          // Get App Store ID from company record, or use default
          const companyResult = await pool.query('SELECT app_store_id FROM companies WHERE id = $1', [companyId]);
          const appStoreId = companyResult.rows[0]?.app_store_id || 'mock-app-id';
          await dataCollector.collectAppStoreReviews(appStoreId, companyId);
        }

        if (sources.includes('google_play')) {
          // Get Google Play package name from company record, or use default
          const companyResult = await pool.query('SELECT google_play_package FROM companies WHERE id = $1', [companyId]);
          const googlePlayPackage = companyResult.rows[0]?.google_play_package || 'com.example.app';
          await dataCollector.collectGooglePlayReviews(googlePlayPackage, companyId);
        }

        // Uzbekistan-specific sources
        if (sources.includes('yandex_maps')) {
          const companyResult = await pool.query('SELECT name FROM companies WHERE id = $1', [companyId]);
          await dataCollector.collectYandexReviews(companyResult.rows[0]?.name || 'Company', companyId);
        }

        if (sources.includes('uzum')) {
          await dataCollector.collectUzumReviews(companyId);
        }

        // Collect social media data
        if (sources.includes('social_media')) {
          // Get social media URLs from company metadata or use company website as base
          const companyResult = await pool.query('SELECT website_url, name FROM companies WHERE id = $1', [companyId]);
          const company = companyResult.rows[0];
          
          // For MVP, try to find social media links from company website
          // In production, these should be stored in company profile
          if (company?.website_url) {
            // Try common social media patterns
            const baseDomain = company.website_url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
            const socialUrls = [
              `https://www.facebook.com/${baseDomain}`,
              `https://www.instagram.com/${baseDomain}`,
              `https://twitter.com/${baseDomain}`,
              `https://www.linkedin.com/company/${baseDomain}`,
            ];
            
            await dataCollector.collectSocialMedia(companyId, socialUrls);
          }
        }

        // Collect media articles
        if (sources.includes('media')) {
          const companyResult = await pool.query('SELECT name FROM companies WHERE id = $1', [companyId]);
          const companyName = companyResult.rows[0]?.name || 'Company';
          await dataCollector.collectMediaArticles(companyId, companyName);
        }

        // Process raw data and extract value propositions
        await dataCollector.processRawData(companyId);
        
        // Get all raw data with content (including previously failed items with content)
        const rawDataResult = await pool.query(
          `SELECT * FROM raw_data 
           WHERE company_id = $1 
           AND status = 'processed'
           AND content IS NOT NULL 
           AND content != '' 
           AND LENGTH(content) > 50`,
          [companyId]
        );

        console.log(`Extracting value propositions from ${rawDataResult.rows.length} processed items`);

        let totalExtracted = 0;
        for (const rawData of rawDataResult.rows) {
          try {
            const propositions = nlpService.extractValuePropositions(
              rawData.content,
              rawData.source_type,
              rawData.source_url || '',
              companyId
            );

            console.log(`Extracted ${propositions.length} propositions from ${rawData.source_type}: ${rawData.source_url}`);

            for (const prop of propositions) {
              // Skip if extracted text is too generic or short
              if (!prop.extracted_text || prop.extracted_text.length < 15) {
                continue;
              }

              await pool.query(
                `INSERT INTO value_propositions 
                 (company_id, source_type, source_url, extracted_text, category, job_type, gain_type, confidence)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT DO NOTHING`,
                [prop.company_id, prop.source_type, prop.source_url, prop.extracted_text,
                 prop.category, prop.job_type || null, prop.gain_type || null, prop.confidence]
              );
              totalExtracted++;
            }
          } catch (error: any) {
            console.error(`Error extracting propositions from ${rawData.source_url}:`, error.message);
          }
        }

        console.log(`Total value propositions extracted: ${totalExtracted}`);

        // Analyze reviews
        const reviewsResult = await pool.query('SELECT * FROM reviews WHERE company_id = $1', [companyId]);
        for (const review of reviewsResult.rows) {
          const analysis = nlpService.analyzeReview(review);
          
          // Update review sentiment
          await pool.query(
            'UPDATE reviews SET sentiment_score = $1 WHERE id = $2',
            [analysis.sentiment, review.id]
          );

          // Save analysis
          await pool.query(
            `INSERT INTO customer_feedback_analysis 
             (company_id, review_id, jobs_mentioned, pains_mentioned, gains_mentioned, sentiment, topics)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [companyId, review.id, JSON.stringify(analysis.jobs_mentioned),
             JSON.stringify(analysis.pains_mentioned), JSON.stringify(analysis.gains_mentioned),
             analysis.sentiment, JSON.stringify(analysis.topics)]
          );
        }

        // Update audit status
        await pool.query('UPDATE audits SET status = $1 WHERE id = $2', ['analyzing', audit.id]);

        // Calculate scores
        await scoringService.calculateScores(companyId, audit.id);

        // Identify gaps
        await scoringService.identifyGaps(companyId, audit.id);

        // Mark audit as complete
        await pool.query(
          'UPDATE audits SET status = $1, end_date = CURRENT_TIMESTAMP WHERE id = $2',
          ['completed', audit.id]
        );
      } catch (error) {
        console.error('Error in audit processing:', error);
        await pool.query('UPDATE audits SET status = $1 WHERE id = $2', ['failed', audit.id]);
      }
    })();

    res.status(201).json({ audit, message: 'Audit started. Processing in background.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get data collection statistics (must be before /:id/audits/:auditId to avoid route conflict)
router.get('/:id/data-sources', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id: companyId } = req.params;

    // Verify company ownership
    const companyCheck = await pool.query(
      'SELECT id FROM companies WHERE id = $1 AND created_by = $2',
      [companyId, req.user!.id]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get review counts by source
    const reviewCounts = await pool.query(
      `SELECT 
        source,
        COUNT(*) as count,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_count,
        AVG(rating) as avg_rating,
        MIN(review_date) as earliest_review,
        MAX(review_date) as latest_review
       FROM reviews 
       WHERE company_id = $1 
       GROUP BY source 
       ORDER BY count DESC`,
      [companyId]
    );

    // Get the latest audit to filter data by audit time period
    const latestAuditResult = await pool.query(
      `SELECT id, start_date, time_period_start, time_period_end 
       FROM audits 
       WHERE company_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [companyId]
    );
    
    const latestAudit = latestAuditResult.rows[0];
    const filterByAudit = latestAudit ? `AND rd.collected_at >= $2` : '';
    const queryParams = latestAudit 
      ? [companyId, latestAudit.start_date || latestAudit.time_period_start]
      : [companyId];

    // Get raw data counts by source type with error details (from latest audit only)
    const rawDataCountsResult = await pool.query(
      `SELECT 
        rd.source_type,
        COUNT(*) as count,
        COUNT(CASE WHEN rd.status = 'processed' THEN 1 END) as processed_count,
        COUNT(CASE WHEN rd.status = 'failed' THEN 1 END) as failed_count,
        MAX(rd.collected_at) as latest_collection
       FROM raw_data rd
       WHERE rd.company_id = $1 ${filterByAudit}
       GROUP BY rd.source_type 
       ORDER BY count DESC`,
      queryParams
    );

    // Get sample error for each source type (from latest audit)
    const rawDataCounts = await Promise.all(
      rawDataCountsResult.rows.map(async (row) => {
        const errorResult = await pool.query(
          `SELECT metadata->>'error' as error, collected_at
           FROM raw_data 
           WHERE company_id = $1 
           AND source_type = $2 
           AND status = 'failed' 
           AND metadata->>'error' IS NOT NULL
           ${filterByAudit}
           ORDER BY collected_at DESC
           LIMIT 1`,
          queryParams.concat([row.source_type])
        );
        return {
          ...row,
          sample_error: errorResult.rows[0]?.error || null,
          latest_collection: row.latest_collection,
        };
      })
    );

    // Get total statistics
    const totalStats = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        COUNT(DISTINCT source) as unique_sources,
        AVG(rating) as overall_avg_rating,
        COUNT(CASE WHEN verified = true THEN 1 END) as total_verified
       FROM reviews 
       WHERE company_id = $1`,
      [companyId]
    );

    res.json({
      review_sources: reviewCounts.rows.map(row => ({
        source: row.source,
        count: parseInt(row.count),
        verified_count: parseInt(row.verified_count || '0'),
        avg_rating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : null,
        earliest_review: row.earliest_review,
        latest_review: row.latest_review,
      })),
      raw_data_sources: rawDataCounts.map(row => ({
        source_type: row.source_type,
        count: parseInt(row.count),
        processed_count: parseInt(row.processed_count || '0'),
        failed_count: parseInt(row.failed_count || '0'),
        sample_error: row.sample_error || null,
        latest_collection: row.latest_collection,
        from_latest_audit: latestAudit ? true : false,
      })),
      latest_audit_info: latestAudit ? {
        audit_id: latestAudit.id,
        start_date: latestAudit.start_date,
        time_period_start: latestAudit.time_period_start,
        time_period_end: latestAudit.time_period_end,
      } : null,
      totals: {
        total_reviews: parseInt(totalStats.rows[0]?.total_reviews || '0'),
        unique_sources: parseInt(totalStats.rows[0]?.unique_sources || '0'),
        overall_avg_rating: totalStats.rows[0]?.overall_avg_rating ? parseFloat(totalStats.rows[0].overall_avg_rating).toFixed(1) : null,
        total_verified: parseInt(totalStats.rows[0]?.total_verified || '0'),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all audits for a company
router.get('/:id/audits', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id: companyId } = req.params;

    // Verify company ownership
    const companyCheck = await pool.query(
      'SELECT id FROM companies WHERE id = $1 AND created_by = $2',
      [companyId, req.user!.id]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const auditsResult = await pool.query(
      'SELECT * FROM audits WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId]
    );

    res.json({ audits: auditsResult.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed audit analysis (must be before /:id/audits/:auditId to avoid route conflict)
router.get('/:id/audits/:auditId/detailed', authenticateToken, async (req: AuthRequest, res) => {
  // #region agent log
  console.log(`[DEBUG] Detailed audit route hit: companyId=${req.params.id}, auditId=${req.params.auditId}, user=${req.user?.id}`);
  // #endregion
  try {
    const { id: companyId, auditId } = req.params;

    // Verify company ownership
    const companyCheck = await pool.query(
      'SELECT id FROM companies WHERE id = $1 AND created_by = $2',
      [companyId, req.user!.id]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get audit and scores
    const auditResult = await pool.query(
      'SELECT * FROM audits WHERE id = $1 AND company_id = $2',
      [auditId, companyId]
    );

    if (auditResult.rows.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const scoreResult = await pool.query(
      'SELECT * FROM audit_scores WHERE audit_id = $1',
      [auditId]
    );

    // Get value propositions (promises) by category - top 5 per category
    const promisesJobs = await pool.query(
      `SELECT * FROM value_propositions 
       WHERE company_id = $1 AND category = 'job' 
       ORDER BY confidence DESC 
       LIMIT 5`,
      [companyId]
    );

    const promisesPains = await pool.query(
      `SELECT * FROM value_propositions 
       WHERE company_id = $1 AND category = 'pain' 
       ORDER BY confidence DESC 
       LIMIT 5`,
      [companyId]
    );

    const promisesGains = await pool.query(
      `SELECT * FROM value_propositions 
       WHERE company_id = $1 AND category = 'gain' 
       ORDER BY confidence DESC 
       LIMIT 5`,
      [companyId]
    );

    // Get customer feedback analysis
    const feedbackResult = await pool.query(
      `SELECT cfa.*, r.review_text, r.rating, r.review_date, r.source
       FROM customer_feedback_analysis cfa
       JOIN reviews r ON r.id = cfa.review_id
       WHERE cfa.company_id = $1`,
      [companyId]
    );

    // Process feedback to extract key points per dimension
    const processFeedbackForDimension = (category: 'job' | 'pain' | 'gain', promises: any[]) => {
      const keyPoints: any[] = [];

      for (const promise of promises) {
        // Find matching feedback
        const matchingFeedback = feedbackResult.rows.filter(f => {
          let items: any[] = [];
          try {
            // Parse JSON fields if they're strings
            if (category === 'job') {
              items = typeof f.jobs_mentioned === 'string' ? JSON.parse(f.jobs_mentioned) : (f.jobs_mentioned || []);
            } else if (category === 'pain') {
              items = typeof f.pains_mentioned === 'string' ? JSON.parse(f.pains_mentioned) : (f.pains_mentioned || []);
            } else if (category === 'gain') {
              items = typeof f.gains_mentioned === 'string' ? JSON.parse(f.gains_mentioned) : (f.gains_mentioned || []);
            }
          } catch (e) {
            items = [];
          }

          return items.some((item: any) => {
            // Simple keyword matching
            const promiseWords = promise.extracted_text.toLowerCase().split(/\W+/);
            const itemWords = (item.text || '').toLowerCase().split(/\W+/);
            const commonWords = promiseWords.filter(w => w.length > 3 && itemWords.includes(w));
            return commonWords.length >= 2;
          });
        });

        // Get feedback quotes (up to 5)
        const feedbackQuotes = matchingFeedback
          .slice(0, 5)
          .map(f => ({
            text: f.review_text,
            rating: f.rating,
            source: f.source,
            sentiment: f.sentiment,
            date: f.review_date,
          }));

        // Get summary statistics
        const sentimentScore = matchingFeedback.length > 0
          ? matchingFeedback.reduce((sum, f) => sum + (f.sentiment || 0.5), 0) / matchingFeedback.length
          : 0.5;

        const mentionCount = matchingFeedback.length;
        const totalReviews = feedbackResult.rows.length;
        const mentionPercentage = totalReviews > 0 ? (mentionCount / totalReviews) * 100 : 0;

        keyPoints.push({
          promise: {
            text: promise.extracted_text,
            source_type: promise.source_type,
            source_url: promise.source_url,
            job_type: promise.job_type,
            gain_type: promise.gain_type,
            confidence: promise.confidence,
          },
          customer_feedback: {
            mention_count: mentionCount,
            mention_percentage: Math.round(mentionPercentage),
            sentiment_score: sentimentScore.toFixed(2),
            quotes: feedbackQuotes,
          },
          fulfillment_status: mentionPercentage > 30 ? 'fulfilled' : mentionPercentage > 10 ? 'partial' : 'not_fulfilled',
        });
      }

      // If we don't have enough promises, create generic points based on low scores
      if (keyPoints.length < 3 && scoreResult.rows.length > 0) {
        const score = scoreResult.rows[0];
        const dimensionScore = category === 'job' ? score.jobs_score : 
                              category === 'pain' ? score.pains_score : score.gains_score;
        
        if (dimensionScore < 60 && feedbackResult.rows.length > 0) {
          keyPoints.push({
            promise: {
              text: `Company promises to deliver ${category === 'job' ? 'specific jobs to be done' : category === 'pain' ? 'pain relief' : 'customer gains'}`,
              source_type: 'general',
              confidence: 0.8,
            },
            customer_feedback: {
              mention_count: 0,
              mention_percentage: 0,
              sentiment_score: '0.50',
              quotes: feedbackResult.rows.slice(0, 3).map(f => ({
                text: f.review_text || 'No review text available',
                rating: f.rating || 0,
                source: f.source || 'Unknown',
                sentiment: f.sentiment || 0.5,
                date: f.review_date || new Date().toISOString(),
              })),
            },
            fulfillment_status: 'not_fulfilled',
          });
        }
      }

      return keyPoints.slice(0, 5);
    };

    const jobsPoints = processFeedbackForDimension('job', promisesJobs.rows);
    const painsPoints = processFeedbackForDimension('pain', promisesPains.rows);
    const gainsPoints = processFeedbackForDimension('gain', promisesGains.rows);

    const responseData = {
      audit: auditResult.rows[0],
      scores: scoreResult.rows[0] || null,
      dimensions: {
        jobs_fulfillment: {
          score: scoreResult.rows[0]?.jobs_score || 0,
          key_points: jobsPoints || [],
        },
        pain_relief: {
          score: scoreResult.rows[0]?.pains_score || 0,
          key_points: painsPoints || [],
        },
        gain_achievement: {
          score: scoreResult.rows[0]?.gains_score || 0,
          key_points: gainsPoints || [],
        },
      },
    };
    // #region agent log
    console.log(`[DEBUG] Sending detailed audit response: auditId=${auditId}, scores=${JSON.stringify(scoreResult.rows[0] || null)}`);
    // #endregion
    res.json(responseData);
  } catch (error: any) {
    // #region agent log
    console.error(`[DEBUG] Error in detailed audit route: ${error.message}`, error.stack);
    // #endregion
    console.error('Error in detailed audit endpoint:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get audit results
router.get('/:id/audits/:auditId', authenticateToken, async (req: AuthRequest, res) => {
  // #region agent log
  console.log(`[DEBUG] Audit route hit: companyId=${req.params.id}, auditId=${req.params.auditId}, user=${req.user?.id}`);
  // #endregion
  try {
    const { id: companyId, auditId } = req.params;

    // Get audit
    const auditResult = await pool.query(
      'SELECT * FROM audits WHERE id = $1 AND company_id = $2',
      [auditId, companyId]
    );

    if (auditResult.rows.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    // Get scores
    const scoreResult = await pool.query(
      'SELECT * FROM audit_scores WHERE audit_id = $1',
      [auditId]
    );

    // Get gaps
    const gapsResult = await pool.query(
      'SELECT * FROM gap_analysis WHERE audit_id = $1 ORDER BY impact_score DESC',
      [auditId]
    );
    console.log(`Found ${gapsResult.rows.length} gaps in database for audit ${auditId}`);
    
    if (gapsResult.rows.length === 0 && scoreResult.rows[0]) {
      console.warn(`No gaps found for audit ${auditId}, but scores exist:`, {
        jobs: scoreResult.rows[0].jobs_score,
        pains: scoreResult.rows[0].pains_score,
        gains: scoreResult.rows[0].gains_score,
        overall: scoreResult.rows[0].overall_score
      });
    }

    // Get value propositions for promises
    const promisesResult = await pool.query(
      'SELECT * FROM value_propositions WHERE company_id = $1 ORDER BY confidence DESC',
      [companyId]
    );

    // Get customer feedback analysis
    const feedbackResult = await pool.query(
      `SELECT cfa.*, r.review_text, r.rating, r.review_date, r.source
       FROM customer_feedback_analysis cfa
       JOIN reviews r ON r.id = cfa.review_id
       WHERE cfa.company_id = $1`,
      [companyId]
    );

    // Enhance gaps with detailed promise and reality points
    const enhancedGaps = await Promise.all(
      gapsResult.rows.map(async (gap) => {
        // Get up to 5 specific promises for this gap type
        const categoryMap: { [key: string]: string } = {
          'jobs': 'job',
          'pains': 'pain',
          'gains': 'gain',
        };
        const category = categoryMap[gap.gap_type] || gap.gap_type;
        
        const relevantPromises = promisesResult.rows
          .filter(p => p.category === category)
          .slice(0, 5)
          .map(p => ({
            text: p.extracted_text,
            source_type: p.source_type,
            source_url: p.source_url,
            confidence: p.confidence,
            job_type: p.job_type,
            gain_type: p.gain_type,
          }));

        // Get up to 5 customer feedback points showing non-delivery
        let realityPoints: any[] = [];
        
        if (gap.gap_type === 'jobs') {
          // For jobs: find reviews that don't mention the promised jobs
          const promisedJobTexts = relevantPromises.map(p => p.text.toLowerCase());
          realityPoints = feedbackResult.rows
            .filter(f => {
              const jobsMentioned = (f.jobs_mentioned || []).map((j: any) => j.text?.toLowerCase() || '');
              // Check if review mentions any of the promised jobs
              const mentionsPromisedJob = promisedJobTexts.some(promiseText => 
                jobsMentioned.some((mentioned: string) => 
                  mentioned.includes(promiseText.substring(0, 20)) || promiseText.includes(mentioned.substring(0, 20))
                )
              );
              return !mentionsPromisedJob || f.sentiment < 0.4; // Low sentiment or no mention
            })
            .slice(0, 5)
            .map(f => ({
              text: f.review_text,
              rating: f.rating,
              source: f.source,
              sentiment: f.sentiment,
              date: f.review_date,
              issue: 'Job not fulfilled or low satisfaction',
            }));
        } else if (gap.gap_type === 'pains') {
          // For pains: find reviews that still mention the pains
          const promisedPainTexts = relevantPromises.map(p => p.text.toLowerCase());
          realityPoints = feedbackResult.rows
            .filter(f => {
              const painsMentioned = (f.pains_mentioned || []).map((p: any) => p.text?.toLowerCase() || '');
              return painsMentioned.some((pain: string) => 
                promisedPainTexts.some(promiseText => 
                  pain.includes(promiseText.substring(0, 20)) || promiseText.includes(pain.substring(0, 20))
                )
              );
            })
            .slice(0, 5)
            .map(f => ({
              text: f.review_text,
              rating: f.rating,
              source: f.source,
              sentiment: f.sentiment,
              date: f.review_date,
              issue: 'Pain still experienced despite promise',
            }));
        } else if (gap.gap_type === 'gains') {
          // For gains: find reviews that don't mention the promised gains
          const promisedGainTexts = relevantPromises.map(p => p.text.toLowerCase());
          realityPoints = feedbackResult.rows
            .filter(f => {
              const gainsMentioned = (f.gains_mentioned || []).map((g: any) => g.text?.toLowerCase() || '');
              const mentionsPromisedGain = promisedGainTexts.some(promiseText => 
                gainsMentioned.some((mentioned: string) => 
                  mentioned.includes(promiseText.substring(0, 20)) || promiseText.includes(mentioned.substring(0, 20))
                )
              );
              return !mentionsPromisedGain || f.sentiment < 0.4;
            })
            .slice(0, 5)
            .map(f => ({
              text: f.review_text,
              rating: f.rating,
              source: f.source,
              sentiment: f.sentiment,
              date: f.review_date,
              issue: 'Promised gain not achieved',
            }));
        }

        // If we don't have enough reality points, add generic ones based on low sentiment
        if (realityPoints.length < 3) {
          const lowSentimentReviews = feedbackResult.rows
            .filter(f => f.sentiment < 0.5)
            .slice(0, 5 - realityPoints.length)
            .map(f => ({
              text: f.review_text,
              rating: f.rating,
              source: f.source,
              sentiment: f.sentiment,
              date: f.review_date,
              issue: 'Customer dissatisfaction',
            }));
          realityPoints = [...realityPoints, ...lowSentimentReviews].slice(0, 5);
        }

        return {
          ...gap,
          detailed_promises: relevantPromises.length > 0 ? relevantPromises : [{
            text: gap.promise_text,
            source_type: 'general',
            confidence: 0.8,
          }],
          detailed_reality: realityPoints.length > 0 ? realityPoints : [{
            text: gap.reality_text,
            source: 'analysis',
            issue: 'Gap identified',
          }],
        };
      })
    );

    const responseData = {
      audit: auditResult.rows[0],
      scores: scoreResult.rows[0] || null,
      gaps: enhancedGaps,
    };
    // #region agent log
    console.log(`[DEBUG] Sending audit response (gaps): auditId=${auditId}, gapsCount=${enhancedGaps.length}, scores=${JSON.stringify(scoreResult.rows[0] || null)}`);
    // #endregion
    res.json(responseData);
  } catch (error: any) {
    // #region agent log
    console.error(`[DEBUG] Error in audit route (gaps): ${error.message}`, error.stack);
    // #endregion
    res.status(500).json({ error: error.message });
  }
});

// Regenerate gaps for an existing audit
router.post('/:id/audits/:auditId/regenerate-gaps', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const companyId = req.params.id;
    const auditId = req.params.auditId;

    // Verify company ownership
    const companyResult = await pool.query(
      'SELECT * FROM companies WHERE id = $1 AND created_by = $2',
      [companyId, req.user!.id]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Verify audit exists and belongs to company
    const auditResult = await pool.query(
      'SELECT * FROM audits WHERE id = $1 AND company_id = $2',
      [auditId, companyId]
    );

    if (auditResult.rows.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    // Regenerate gaps
    const gaps = await scoringService.identifyGaps(companyId, auditId);

    res.json({ 
      message: 'Gaps regenerated successfully',
      gapsCount: gaps.length,
      gaps 
    });
  } catch (error: any) {
    console.error('Error regenerating gaps:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

