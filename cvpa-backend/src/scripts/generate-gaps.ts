import { pool } from '../config/database';
import { ScoringService } from '../services/scoring.service';

async function generateGapsForLatestAudit() {
  try {
    // Get latest completed audit
    const auditResult = await pool.query(
      `SELECT id, company_id FROM audits 
       WHERE status = 'completed' 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (auditResult.rows.length === 0) {
      console.log('No completed audits found');
      return;
    }

    const audit = auditResult.rows[0];
    console.log(`Generating gaps for audit ${audit.id}, company ${audit.company_id}`);

    const scoringService = new ScoringService();
    const gaps = await scoringService.identifyGaps(audit.company_id, audit.id);

    console.log(`Generated ${gaps.length} gaps`);
    process.exit(0);
  } catch (error) {
    console.error('Error generating gaps:', error);
    process.exit(1);
  }
}

generateGapsForLatestAudit();

