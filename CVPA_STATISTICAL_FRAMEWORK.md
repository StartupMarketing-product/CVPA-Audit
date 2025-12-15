# CVPA - Statistical Significance Framework & Scoring Methodology

## Statistical Significance Framework

### Minimum Sample Size Calculation

For the CVPA platform to provide statistically significant insights, we need to ensure sufficient sample sizes across all dimensions.

#### Basic Formula
```
n = (Z² × p × (1-p)) / E²
```

Where:
- **n** = Required sample size
- **Z** = Z-score (1.96 for 95% confidence level, 2.576 for 99%)
- **p** = Expected proportion (0.5 for maximum variability/conservative estimate)
- **E** = Margin of error (acceptable sampling error)

#### Recommended Parameters

**Standard Configuration (95% Confidence, 5% Margin of Error):**
- **n = (1.96² × 0.5 × 0.5) / 0.05² = 384.16**
- **Minimum Required: 385 reviews**

**High Confidence Configuration (99% Confidence, 3% Margin of Error):**
- **n = (2.576² × 0.5 × 0.5) / 0.03² = 1,843.27**
- **Recommended for critical audits: 1,844 reviews**

**MVP Configuration (95% Confidence, 7% Margin of Error):**
- **n = (1.96² × 0.5 × 0.5) / 0.07² = 196**
- **Minimum for MVP: 200 reviews**

### Sample Size by Category

For stratified analysis (by product, customer segment, time period), apply the minimum sample size to each category:

#### Total Sample Size Requirements

```
Total Sample Size = Sum of (Minimum Sample Size per Category)
```

**Example:**
- Product A: 385 reviews minimum
- Product B: 385 reviews minimum
- Customer Segment 1: 385 reviews minimum
- Customer Segment 2: 385 reviews minimum
- **Total Required: 1,540 reviews** (if analyzing all categories)

#### Adjustments for Finite Populations

If the total population is known (e.g., total number of reviews available), use:

```
n_adjusted = (n × N) / (n + N - 1)
```

Where:
- **N** = Total population size
- **n** = Sample size from infinite population formula

### Statistical Significance Indicators

#### Confidence Level Indicator
- **95% Confidence**: Standard business decisions
- **99% Confidence**: High-stakes decisions
- **90% Confidence**: Exploratory analysis (not recommended for reports)

#### Margin of Error Display
```
Sample Size: 1,247 reviews
Confidence Level: 95%
Margin of Error: ±3.2%

This means: If we repeated this audit 100 times, 
95 times the true score would be within ±3.2 points 
of the reported score.
```

#### Sample Adequacy Status
- ✅ **Adequate**: n ≥ 385 (for 95% confidence, 5% margin)
- ⚠️ **Marginal**: 200 ≤ n < 385
- ❌ **Inadequate**: n < 200 (should not generate final report)

---

## Scoring Methodology

### Overall Alignment Score Calculation

The Overall Alignment Score is a weighted composite of three dimension scores:

```
Overall Score = (Jobs Score × 0.40) + (Pains Score × 0.30) + (Gains Score × 0.30)
```

**Rationale for Weights:**
- **Jobs (40%)**: Core functional value - most critical
- **Pains (30%)**: Problem-solving capability - important but secondary
- **Gains (30%)**: Enhancement value - important for differentiation

*Note: Weights are configurable per industry/use case.*

### Dimension Score Calculation

#### 1. Jobs Fulfillment Score (0-100)

**Step 1: Extract Promised Jobs**
From company communications, extract:
- Functional jobs (what customers accomplish)
- Emotional jobs (how customers feel)
- Social jobs (how customers are perceived)

**Step 2: Extract Delivered Jobs**
From customer reviews, identify:
- Jobs successfully completed
- Jobs mentioned but not achieved
- Jobs expected but not mentioned by company

**Step 3: Match Jobs**
```
For each promised job:
  - Find matching jobs in customer feedback
  - Calculate similarity score (semantic similarity)
  - Match if similarity > 0.7 (threshold)
```

**Step 4: Calculate Fulfillment Rate**
```
Jobs_Fulfillment_Rate = (Matched_Jobs / Total_Promised_Jobs) × 100
```

**Step 5: Weight by Importance**
```
Importance_Weight = Frequency_in_Reviews / Total_Review_Count

Jobs_Score = Σ(Match_Confidence × Importance_Weight × 100) / Σ(Importance_Weight)
```

**Step 6: Penalty for Unpromised Failures**
```
If customers mention important jobs that were never promised:
  Penalty = -5 points per high-frequency unpromised job failure
  (Capped at -20 points total)
```

**Final Jobs Score:**
```
Jobs_Score = Weighted_Fulfillment_Score - Penalties
```

#### 2. Pain Relief Score (0-100)

**Step 1: Extract Promised Pain Relief**
From company communications:
- Pains claimed to be eliminated
- Problems promised to be solved
- Barriers promised to be removed

**Step 2: Extract Actual Pain Experience**
From customer reviews:
- Pains still experienced
- Problems not solved
- Barriers still present
- New pains created

**Step 3: Calculate Pain Relief Effectiveness**
```
For each promised pain:
  Pain_Mentions_Before = Historical mentions (if available)
  Pain_Mentions_Current = Current review mentions
  Pain_Reduction = (Pain_Mentions_Before - Pain_Mentions_Current) / Pain_Mentions_Before
  
  If Pain_Reduction > 0.5: Fully Relieved (100 points)
  If Pain_Reduction > 0.25: Partially Relieved (50 points)
  If Pain_Reduction ≤ 0.25: Not Relieved (0 points)
```

**Step 4: Weight by Pain Severity**
```
Pain_Severity = (Negative_Sentiment_Score × Frequency) / Total_Reviews

Pains_Score = Σ(Pain_Relief_Score × Pain_Severity) / Σ(Pain_Severity)
```

**Step 5: Penalty for New Pains**
```
If company creates new significant pains:
  New_Pain_Penalty = -10 points per high-frequency new pain
  (Capped at -30 points total)
```

**Final Pains Score:**
```
Pains_Score = Weighted_Relief_Score - New_Pain_Penalties
```

#### 3. Gain Achievement Score (0-100)

**Step 1: Extract Promised Gains**
From company communications:
- Required gains (must-haves)
- Expected gains (nice-to-haves)
- Desired gains (wants)
- Unexpected gains (delighters)

**Step 2: Extract Achieved Gains**
From customer reviews:
- Gains realized
- Gains expected but not received
- Unexpected gains discovered

**Step 3: Match and Score Gains**
```
For each promised gain:
  Gain_Mentions = Frequency in customer reviews
  Gain_Sentiment = Average sentiment of mentions
  
  If Gain_Mentions > Threshold AND Gain_Sentiment > 0.6:
    Gain_Achieved = True (100 points)
  Else if Gain_Mentions > Threshold AND Gain_Sentiment > 0.4:
    Gain_Partially_Achieved = True (60 points)
  Else:
    Gain_Not_Achieved = True (0 points)
```

**Step 4: Weight by Gain Type**
```
Type_Weights:
  Required: 1.0
  Expected: 0.8
  Desired: 0.6
  Unexpected: 0.4 (bonus, doesn't reduce score if missing)

Gains_Score = Σ(Gain_Score × Type_Weight) / Σ(Type_Weight)
```

**Step 5: Bonus for Unexpected Gains**
```
Unexpected_Gain_Bonus = +2 points per validated unexpected gain
(Capped at +10 points total)
```

**Final Gains Score:**
```
Gains_Score = Weighted_Achievement_Score + Unexpected_Bonuses
```

---

## Gap Analysis Methodology

### Gap Identification

A gap exists when:
1. **Promise-Reality Mismatch**: Company promises X, but reality is Y (or not X)
2. **Frequency Threshold**: Gap mentioned in ≥5% of reviews
3. **Sentiment Threshold**: Average sentiment < 0.4 (negative)

### Gap Severity Calculation

```
Gap_Severity_Score = (Frequency_Weight × 0.4) + (Sentiment_Impact × 0.4) + (Score_Impact × 0.2)
```

Where:
- **Frequency_Weight** = (Gap_Mentions / Total_Reviews) × 100
- **Sentiment_Impact** = (1 - Average_Sentiment) × 100
- **Score_Impact** = Direct impact on dimension score (points lost)

**Severity Categories:**
- **Critical**: Score ≥ 70 (Red)
- **High**: Score 50-69 (Orange)
- **Medium**: Score 30-49 (Yellow)
- **Low**: Score < 30 (Blue)

### Gap Priority Ranking

```
Priority_Score = (Gap_Severity × 0.5) + (Business_Impact × 0.3) + (Fixability × 0.2)
```

Where:
- **Business_Impact**: Customer retention risk, revenue impact (estimated)
- **Fixability**: Ease of resolution (1 = easy, 10 = difficult)

---

## Trend Analysis

### Score Trend Calculation

```
Trend_Direction = Current_Score - Previous_Score

If Trend_Direction > 5: Improving (↑)
If Trend_Direction < -5: Declining (↓)
If |Trend_Direction| ≤ 5: Stable (→)
```

### Statistical Significance of Trends

Use paired t-test to determine if trend is statistically significant:

```
t = (Mean_Difference) / (SD_Difference / √n)

If |t| > Critical_Value (for chosen confidence level):
  Trend is statistically significant
Else:
  Trend may be due to random variation
```

---

## Quality Metrics

### Data Quality Score

```
Data_Quality_Score = (Authenticity × 0.4) + (Recency × 0.3) + (Completeness × 0.2) + (Diversity × 0.1)
```

Where:
- **Authenticity** = % verified authentic reviews (non-spam, non-bot)
- **Recency** = % reviews from analysis period
- **Completeness** = % reviews with sufficient detail (≥50 words)
- **Diversity** = Distribution across sources (entropy-based)

### Confidence Intervals

For each score, calculate confidence interval:

```
CI = Score ± (Z × SE)

Where:
SE = Standard Error = SD / √n
Z = Z-score for confidence level (1.96 for 95%)
```

**Example:**
```
Overall Score: 78
Sample Size: 1,247
Standard Deviation: 12.5
Standard Error: 12.5 / √1247 = 0.354
95% CI: 78 ± (1.96 × 0.354) = 78 ± 0.69 = [77.31, 78.69]
```

---

## Validation & Calibration

### Human Validation Framework

1. **Sample Validation**: Human reviewers validate 10% random sample of:
   - Extracted promises (JTBD, Pains, Gains)
   - Extracted reality (customer feedback categorization)
   - Gap identifications

2. **Accuracy Metrics**:
   - **Precision**: % of extracted items that are correct
   - **Recall**: % of actual items that were extracted
   - **F1 Score**: Harmonic mean of precision and recall

3. **Target Metrics** (MVP):
   - Precision: > 85%
   - Recall: > 80%
   - F1 Score: > 82%

### Model Calibration

Regular retraining with validated data:
- Quarterly model updates
- Continuous learning from user feedback
- A/B testing of new models before deployment

---

## Implementation Notes

### MVP Simplifications

1. **Fixed Weights**: Use standard weights (40/30/30) for MVP
2. **Basic Matching**: Keyword + semantic similarity (no advanced ML)
3. **Simple Sentiment**: VADER or TextBlob (no custom model)
4. **Threshold-Based**: Fixed thresholds (no dynamic adjustment)

### Future Enhancements

1. **Custom Models**: Industry-specific NLP models
2. **Dynamic Weights**: Machine learning to optimize weights
3. **Predictive Analytics**: Forecast score changes
4. **Competitive Benchmarking**: Compare against industry averages

---

## Example Calculation

### Scenario
- Company promises: "Instant support, easy setup, powerful features"
- Sample size: 1,247 reviews
- Confidence level: 95%

### Step-by-Step Calculation

**Jobs Analysis:**
- Promised: "Get instant support" (functional), "Feel confident" (emotional)
- Found in reviews: "Support is slow" (78% of reviews), "Feel frustrated" (45%)
- Matched: 0 functional jobs (contradiction), 1 emotional job (opposite)
- Jobs Score: 25/100 (poor match, high penalties)

**Pains Analysis:**
- Promised to eliminate: "Complex setup", "Slow performance"
- Still mentioned: "Complex setup" (15% of reviews, negative sentiment), "Slow performance" (8% of reviews)
- Pain Relief: Complex setup (15% still mentioned) = 40 points, Slow performance (8% still mentioned) = 60 points
- Pains Score: 48/100 (weighted average)

**Gains Analysis:**
- Promised: "Easy setup" (expected), "Powerful features" (required)
- Achieved: "Easy setup" mentioned positively (65% of reviews), "Powerful features" mentioned (82% of reviews, mixed sentiment)
- Gains Score: 75/100 (good achievement of promised gains)

**Overall Score:**
```
Overall = (25 × 0.4) + (48 × 0.3) + (75 × 0.3)
Overall = 10 + 14.4 + 22.5 = 46.9 ≈ 47/100
```

**Interpretation:**
- Poor alignment (score: 47/100)
- Major gaps in support promises (Jobs: 25)
- Moderate pain relief (Pains: 48)
- Good gain delivery (Gains: 75)
- Primary issue: Support promises not being met

