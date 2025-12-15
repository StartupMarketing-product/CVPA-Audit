import Sentiment from 'sentiment';
import natural from 'natural';
import { Review, ValueProposition, CustomerFeedbackAnalysis } from '../types';

const sentiment = new Sentiment();
const tokenizer = new natural.WordTokenizer();

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

export class NLPService {
  analyzeSentiment(text: string): number {
    const result = sentiment.analyze(text);
    // Convert to -1 to 1 scale, then to 0 to 1 scale
    return (result.score / (result.words.length || 1) + 1) / 2;
  }

  extractJobs(text: string): Array<{ text: string; type: string; confidence: number }> {
    const jobs: Array<{ text: string; type: string; confidence: number }> = [];
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

  extractPains(text: string): Array<{ text: string; severity: string; confidence: number }> {
    const pains: Array<{ text: string; severity: string; confidence: number }> = [];
    const textLower = text.toLowerCase();
    const sentimentScore = this.analyzeSentiment(text);

    for (const keyword of PAIN_KEYWORDS) {
      if (textLower.includes(keyword)) {
        const sentences = text.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(keyword)) {
            // Determine severity based on sentiment
            let severity = 'medium';
            if (sentimentScore < 0.3) severity = 'high';
            if (sentimentScore < 0.2) severity = 'critical';

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

  extractGains(text: string): Array<{ text: string; type: string; confidence: number }> {
    const gains: Array<{ text: string; type: string; confidence: number }> = [];
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

  analyzeReview(review: Review): CustomerFeedbackAnalysis {
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

  extractValuePropositions(text: string, sourceType: string, sourceUrl: string, companyId: string): ValueProposition[] {
    const propositions: ValueProposition[] = [];
    const textLower = text.toLowerCase();

    // Split into sentences and phrases
    const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 10);

    // Pattern-based extraction for more specific promises
    const jobPatterns = [
      // Direct job statements
      /(?:help|enable|allow|lets?|lets you|you can|enables you to|helps you|assist|support).*?(?:you|users|customers|clients|people)/gi,
      /(?:accomplish|complete|finish|achieve|get done|make it easy to)/gi,
      /(?:so you can|so that you|enabling you|to help you)/gi,
      // Value proposition patterns
      /(?:we help|we enable|we make it|we allow|we assist)/gi,
    ];

    const painReliefPatterns = [
      // Pain elimination patterns
      /(?:no more|never again|eliminate|remove|end|stop|get rid of|free from|without)/gi,
      /(?:solve|fix|address|resolve|tackle|deal with|overcome|avoid)/gi,
      /(?:don't|won't|no need to|no longer)/gi,
      // Problem-solving patterns
      /(?:problem|issue|challenge|pain|difficulty|struggle|frustration).*?(?:solved|fixed|addressed|eliminated|removed|resolved)/gi,
    ];

    const gainPatterns = [
      // Direct benefit statements
      /(?:save|earn|gain|get|receive|obtain|achieve|improve|increase|reduce|decrease)/gi,
      /(?:faster|easier|better|more|less|cheaper|affordable|convenient)/gi,
      // Value statements
      /(?:you'll|you will|you get|you receive|benefit from|enjoy)/gi,
      // Feature-benefit patterns
      /(?:which means|so you|resulting in|leading to|giving you|providing you)/gi,
    ];

    // Extract specific jobs (JTBD)
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      
      // Check for job patterns
      for (const pattern of jobPatterns) {
        if (pattern.test(sentence)) {
          // Clean up and extract meaningful promise
          let extracted = sentence.trim();
          
          // Remove common prefixes that don't add value
          extracted = extracted.replace(/^(we help|we enable|we make it|we allow|we assist|help|enable|allows?|lets? you|you can|enables you to|helps you)/i, '').trim();
          extracted = extracted.replace(/^(to|so|and|,)/i, '').trim();
          
          if (extracted.length > 15 && extracted.length < 200) {
            // Determine job type
            let jobType: 'functional' | 'emotional' | 'social' = 'functional';
            if (/feel|confident|happy|satisfied|relieved|proud|secure|comfortable|peace/i.test(extracted)) {
              jobType = 'emotional';
            } else if (/perceived|recognized|valued|respected|admired|seen|viewed/i.test(extracted)) {
              jobType = 'social';
            }
            
            propositions.push({
              id: '',
              company_id: companyId,
              source_type: sourceType,
              source_url: sourceUrl,
              extracted_text: extracted.charAt(0).toUpperCase() + extracted.slice(1),
              category: 'job',
              job_type: jobType,
              confidence: 0.8,
              extracted_at: new Date(),
            });
            break; // Only extract once per sentence
          }
        }
      }
    }

    // Extract specific pain relief promises
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      
      // Check for pain relief patterns
      for (const pattern of painReliefPatterns) {
        if (pattern.test(sentence)) {
          let extracted = sentence.trim();
          
          // Clean up extraction
          extracted = extracted.replace(/^(we|our solution|our product|our service)/i, '').trim();
          
          if (extracted.length > 20 && extracted.length < 200) {
            propositions.push({
              id: '',
              company_id: companyId,
              source_type: sourceType,
              source_url: sourceUrl,
              extracted_text: extracted.charAt(0).toUpperCase() + extracted.slice(1),
              category: 'pain',
              confidence: 0.8,
              extracted_at: new Date(),
            });
            break;
          }
        }
      }
      
      // Also check for explicit pain mentions with solutions
      const painSolutions = sentenceLower.match(/(?:no more|eliminate|solve|fix|address|remove|end|stop)\s+([^.?!]+)/i);
      if (painSolutions && painSolutions[1]) {
        const painText = painSolutions[1].trim();
        if (painText.length > 10 && painText.length < 150) {
          propositions.push({
            id: '',
            company_id: companyId,
            source_type: sourceType,
            source_url: sourceUrl,
            extracted_text: sentence.trim(),
            category: 'pain',
            confidence: 0.85,
            extracted_at: new Date(),
          });
        }
      }
    }

    // Extract specific gains (benefits)
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      
      // Check for gain patterns
      for (const pattern of gainPatterns) {
        if (pattern.test(sentence)) {
          let extracted = sentence.trim();
          
          // Extract the benefit part
          if (/which means|so you|resulting in|leading to|giving you|providing you/i.test(extracted)) {
            const parts = extracted.split(/(?:which means|so you|resulting in|leading to|giving you|providing you)/i);
            if (parts.length > 1) {
              extracted = parts[1].trim();
            }
          }
          
          if (extracted.length > 15 && extracted.length < 200) {
            // Determine gain type
            let gainType: 'required' | 'expected' | 'desired' | 'unexpected' = 'expected';
            if (/must|need|essential|required|crucial|critical/i.test(extracted)) {
              gainType = 'required';
            } else if (/surprised|amazed|delighted|love|excellent|perfect|incredible|amazing|wow/i.test(extracted)) {
              gainType = 'unexpected';
            } else if (/want|would like|prefer|wish|desire/i.test(extracted)) {
              gainType = 'desired';
            }
            
            propositions.push({
              id: '',
              company_id: companyId,
              source_type: sourceType,
              source_url: sourceUrl,
              extracted_text: extracted.charAt(0).toUpperCase() + extracted.slice(1),
              category: 'gain',
              gain_type: gainType,
              confidence: 0.8,
              extracted_at: new Date(),
            });
            break;
          }
        }
      }
    }

    // Also use original keyword-based extraction as fallback for more coverage
    const jobs = this.extractJobs(text);
    for (const job of jobs) {
      // Only add if not already captured by pattern matching
      const alreadyExists = propositions.some(p => 
        p.category === 'job' && 
        (p.extracted_text.toLowerCase().includes(job.text.toLowerCase()) || 
         job.text.toLowerCase().includes(p.extracted_text.toLowerCase()))
      );
      
      if (!alreadyExists && job.text.length > 20) {
        propositions.push({
          id: '',
          company_id: companyId,
          source_type: sourceType,
          source_url: sourceUrl,
          extracted_text: job.text,
          category: 'job',
          job_type: job.type as 'functional' | 'emotional' | 'social',
          confidence: Math.max(0.6, job.confidence),
          extracted_at: new Date(),
        });
      }
    }

    // Deduplicate similar propositions
    const uniquePropositions = this.deduplicatePropositions(propositions);
    
    return uniquePropositions.slice(0, 50); // Limit to top 50 most confident
  }

  private deduplicatePropositions(propositions: ValueProposition[]): ValueProposition[] {
    const unique: ValueProposition[] = [];
    
    for (const prop of propositions) {
      const isDuplicate = unique.some(existing => {
        if (existing.category !== prop.category) return false;
        
        // Check if texts are very similar (simple similarity check)
        const existingWords = existing.extracted_text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const propWords = prop.extracted_text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const commonWords = existingWords.filter(w => propWords.includes(w));
        const similarity = commonWords.length / Math.max(existingWords.length, propWords.length, 1);
        
        return similarity > 0.7; // 70% word overlap = duplicate
      });
      
      if (!isDuplicate) {
        unique.push(prop);
      }
    }
    
    // Sort by confidence and return
    return unique.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }
}

