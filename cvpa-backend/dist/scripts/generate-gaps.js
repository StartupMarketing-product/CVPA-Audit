"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const scoring_service_1 = require("../services/scoring.service");
async function generateGapsForLatestAudit() {
    try {
        // Get latest completed audit
        const auditResult = await database_1.pool.query(`SELECT id, company_id FROM audits 
       WHERE status = 'completed' 
       ORDER BY created_at DESC 
       LIMIT 1`);
        if (auditResult.rows.length === 0) {
            console.log('No completed audits found');
            return;
        }
        const audit = auditResult.rows[0];
        console.log(`Generating gaps for audit ${audit.id}, company ${audit.company_id}`);
        const scoringService = new scoring_service_1.ScoringService();
        const gaps = await scoringService.identifyGaps(audit.company_id, audit.id);
        console.log(`Generated ${gaps.length} gaps`);
        process.exit(0);
    }
    catch (error) {
        console.error('Error generating gaps:', error);
        process.exit(1);
    }
}
generateGapsForLatestAudit();
//# sourceMappingURL=generate-gaps.js.map