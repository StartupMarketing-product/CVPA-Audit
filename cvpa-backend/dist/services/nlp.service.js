"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NLPService = void 0;
const sentiment_1 = __importDefault(require("sentiment"));
const natural_1 = __importDefault(require("natural"));
const sentiment = new sentiment_1.default();
const tokenizer = new natural_1.default.WordTokenizer();
// Keywords for Jobs, Pains, and Gains (simplified for MVP)
const JOB_KEYWORDS = {
    functional: ['accomplish', 'complete', 'finish', 'achieve', 'solve', 'get', 'obtain', 'create', 'build'],
    emotional: ['feel', 'confident', 'happy', 'satisfied', 'relieved', 'proud', 'secure'],
    social: ['perceived', 'recognized', 'valued', 'respected', 'admired'],
};
const PAIN_KEYWORDS = ['problem', 'issue', 'difficult', 'hard', 'frustrating', 'slow', 'broken', 'error', 'bug', 'bad', 'terrible', 'awful', 'hate'];
const GAIN_KEYWORDS = {
    required: ['must', 'need', 'essential', 'required'],
    expected: ['should', 'expect', 'standard'],
    desired: ['want', 'would like', 'prefer', 'wish'],
    unexpected: ['surprised', 'amazed', 'delighted', 'love', 'excellent', 'perfect'],
};
class NLPService {
    analyzeSentiment(text) {
        const result = sentiment.analyze(text);
        // Convert to -1 to 1 scale, then to 0 to 1 scale
        return (result.score / (result.words.length || 1) + 1) / 2;
    }
    extractJobs(text) {
        const jobs = [];
        const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
        const textLower = text.toLowerCase();
        // Check for functional jobs
        for (const keyword of JOB_KEYWORDS.functional) {
            if (textLower.includes(keyword)) {
                // Extract sentence or phrase containing the keyword
                const sentences = text.split(/[.!?]+/);
                for (const sentence of sentences) {
                    if (sentence.toLowerCase().includes(keyword)) {
                        jobs.push({
                            text: sentence.trim(),
                            type: 'functional',
                            confidence: 0.7,
                        });
                        break;
                    }
                }
            }
        }
        // Check for emotional jobs
        for (const keyword of JOB_KEYWORDS.emotional) {
            if (textLower.includes(keyword)) {
                const sentences = text.split(/[.!?]+/);
                for (const sentence of sentences) {
                    if (sentence.toLowerCase().includes(keyword)) {
                        jobs.push({
                            text: sentence.trim(),
                            type: 'emotional',
                            confidence: 0.7,
                        });
                        break;
                    }
                }
            }
        }
        return jobs;
    }
    extractPains(text) {
        const pains = [];
        const textLower = text.toLowerCase();
        const sentimentScore = this.analyzeSentiment(text);
        for (const keyword of PAIN_KEYWORDS) {
            if (textLower.includes(keyword)) {
                const sentences = text.split(/[.!?]+/);
                for (const sentence of sentences) {
                    if (sentence.toLowerCase().includes(keyword)) {
                        // Determine severity based on sentiment
                        let severity = 'medium';
                        if (sentimentScore < 0.3)
                            severity = 'high';
                        if (sentimentScore < 0.2)
                            severity = 'critical';
                        pains.push({
                            text: sentence.trim(),
                            severity,
                            confidence: 0.7,
                        });
                        break;
                    }
                }
            }
        }
        return pains;
    }
    extractGains(text) {
        const gains = [];
        const textLower = text.toLowerCase();
        // Check each gain type
        for (const [type, keywords] of Object.entries(GAIN_KEYWORDS)) {
            for (const keyword of keywords) {
                if (textLower.includes(keyword)) {
                    const sentences = text.split(/[.!?]+/);
                    for (const sentence of sentences) {
                        if (sentence.toLowerCase().includes(keyword)) {
                            gains.push({
                                text: sentence.trim(),
                                type,
                                confidence: 0.7,
                            });
                            break;
                        }
                    }
                }
            }
        }
        return gains;
    }
    analyzeReview(review) {
        const sentiment = this.analyzeSentiment(review.review_text);
        const jobs = this.extractJobs(review.review_text);
        const pains = this.extractPains(review.review_text);
        const gains = this.extractGains(review.review_text);
        // Simple topic extraction (first few keywords)
        const tokens = tokenizer.tokenize(review.review_text.toLowerCase()) || [];
        const topics = tokens
            .filter(token => token.length > 4)
            .slice(0, 5)
            .map(token => ({ keyword: token, weight: 0.5 }));
        return {
            id: '',
            company_id: review.company_id,
            review_id: review.id,
            jobs_mentioned: jobs,
            pains_mentioned: pains,
            gains_mentioned: gains,
            sentiment,
            topics,
            analyzed_at: new Date(),
        };
    }
    extractValuePropositions(text, sourceType, sourceUrl, companyId) {
        const propositions = [];
        // Extract jobs from company communications
        const jobs = this.extractJobs(text);
        for (const job of jobs) {
            propositions.push({
                id: '',
                company_id: companyId,
                source_type: sourceType,
                source_url: sourceUrl,
                extracted_text: job.text,
                category: 'job',
                job_type: job.type,
                confidence: job.confidence,
                extracted_at: new Date(),
            });
        }
        // Extract gains (promised benefits)
        const gains = this.extractGains(text);
        for (const gain of gains) {
            propositions.push({
                id: '',
                company_id: companyId,
                source_type: sourceType,
                source_url: sourceUrl,
                extracted_text: gain.text,
                category: 'gain',
                gain_type: gain.type,
                confidence: gain.confidence,
                extracted_at: new Date(),
            });
        }
        // Extract pain relief promises
        const textLower = text.toLowerCase();
        if (textLower.includes('solve') || textLower.includes('fix') || textLower.includes('eliminate')) {
            const sentences = text.split(/[.!?]+/);
            for (const sentence of sentences) {
                if (sentence.toLowerCase().includes('solve') || sentence.toLowerCase().includes('fix')) {
                    propositions.push({
                        id: '',
                        company_id: companyId,
                        source_type: sourceType,
                        source_url: sourceUrl,
                        extracted_text: sentence.trim(),
                        category: 'pain',
                        confidence: 0.7,
                        extracted_at: new Date(),
                    });
                }
            }
        }
        return propositions;
    }
}
exports.NLPService = NLPService;
//# sourceMappingURL=nlp.service.js.map