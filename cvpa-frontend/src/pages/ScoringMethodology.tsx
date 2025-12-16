import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { ArrowBack, Calculate, TrendingUp, Psychology, EmojiEmotions } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function ScoringMethodologyPage() {
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Scoring Methodology
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          How Scores Are Calculated
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The CVPA platform uses a comprehensive scoring system based on the Jobs-to-be-Done framework
          to evaluate how well a company delivers on its value propositions.
        </Typography>

        {/* Overall Score */}
        <Card sx={{ mb: 4, mt: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Calculate color="primary" fontSize="large" />
              <Typography variant="h5" fontWeight="bold">
                Overall Score
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body1" paragraph>
              The <strong>Overall Score</strong> is a weighted average of the three dimension scores:
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F5F5F5', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Formula:
              </Typography>
              <Typography variant="body1" component="div" sx={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>
                Overall Score = (Jobs Score × 0.4) + (Pains Score × 0.3) + (Gains Score × 0.3)
              </Typography>
            </Paper>

            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Weighting Rationale:</strong> Jobs fulfillment is weighted highest (40%) because it represents
              the core functional value. Pain relief (30%) and gain achievement (30%) are equally important
              for customer satisfaction.
            </Typography>

            <Box mt={2}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Score Interpretation:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="90-100: Excellent"
                    secondary="Company consistently delivers on all value propositions"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="70-89: Good"
                    secondary="Company delivers on most value propositions with minor gaps"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="50-69: Fair"
                    secondary="Significant gaps exist between promises and reality"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="0-49: Poor"
                    secondary="Major misalignment between company promises and customer experience"
                  />
                </ListItem>
              </List>
            </Box>
          </CardContent>
        </Card>

        {/* Jobs Fulfillment Score */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <TrendingUp color="primary" fontSize="large" />
              <Typography variant="h5" fontWeight="bold">
                Jobs Fulfillment Score
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body1" paragraph>
              Measures how well the company helps customers accomplish their <strong>Jobs to be Done</strong>
              (functional, emotional, or social tasks they're trying to accomplish).
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#E3F2FD', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Calculation Process:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Extract Promised Jobs"
                    secondary="Identify all jobs promised by the company from their communications"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Match with Customer Feedback"
                    secondary="Find mentions of these jobs in customer reviews using text similarity matching"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Calculate Fulfillment Rate"
                    secondary="For each promised job: Fulfillment Rate = Matched Mentions / Total Mentions"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Weight by Importance"
                    secondary="Weight each job by its mention frequency across all reviews"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="5. Aggregate Score"
                    secondary="Weighted average of all job fulfillment rates (0-100 scale)"
                  />
                </ListItem>
              </List>
            </Paper>

            <Box mt={2}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Example:
              </Typography>
              <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', bgcolor: '#F5F5F5', p: 1, borderRadius: 1, whiteSpace: 'pre-line' }}>
                {`Company promises: "Help customers shop quickly"
Customer mentions: 60 reviews mention "quick shopping", 40 don't
Fulfillment Rate: 60/100 = 60%
Jobs Score: 60/100`}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Pain Relief Score */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Psychology color="primary" fontSize="large" />
              <Typography variant="h5" fontWeight="bold">
                Pain Relief Score
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body1" paragraph>
              Measures how effectively the company <strong>eliminates customer pains</strong> (frustrations,
              problems, or negative experiences customers want to avoid).
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#FFF3E0', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Calculation Process:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Extract Promised Pain Relief"
                    secondary="Identify all pains the company promises to eliminate"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Check if Pains Still Exist"
                    secondary="Find mentions of these pains in customer reviews (indicating they still exist)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Calculate Pain Reduction"
                    secondary="Pain Reduction = 1 - (Still Mentioned / Total Mentions)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Score Calculation"
                    secondary="Score = 100 if reduction > 50%, otherwise Score = Pain Reduction × 100"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="5. Weighted Average"
                    secondary="Weight by mention frequency and aggregate across all promised pains"
                  />
                </ListItem>
              </List>
            </Paper>

            <Box mt={2}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Example:
              </Typography>
              <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', bgcolor: '#F5F5F5', p: 1, borderRadius: 1, whiteSpace: 'pre-line' }}>
                {`Company promises: "Eliminate long checkout lines"
Customer mentions: 30 reviews still mention "long lines", 70 don't
Pain Reduction: 1 - (30/100) = 70%
Pains Score: 70/100 (since 70% > 50%)`}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Gain Achievement Score */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <EmojiEmotions color="primary" fontSize="large" />
              <Typography variant="h5" fontWeight="bold">
                Gain Achievement Score
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body1" paragraph>
              Measures how well the company delivers <strong>customer gains</strong> (benefits, outcomes,
              or positive experiences customers want to achieve).
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#E8F5E9', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Calculation Process:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Extract Promised Gains"
                    secondary="Identify all gains promised by the company"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Match with Positive Feedback"
                    secondary="Find mentions of these gains in customer reviews with positive sentiment (>0.5)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Calculate Achievement Rate"
                    secondary="Achievement Rate = Positive Mentions / Total Mentions"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Weight by Gain Type"
                    secondary="Required gains (1.0x), Expected (0.8x), Desired (0.6x), Unexpected (0.4x)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="5. Weighted Average"
                    secondary="Weight by mention frequency and gain type importance"
                  />
                </ListItem>
              </List>
            </Paper>

            <Box mt={2}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Example:
              </Typography>
              <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', bgcolor: '#F5F5F5', p: 1, borderRadius: 1, whiteSpace: 'pre-line' }}>
                {`Company promises: "Save customers money" (Required gain)
Customer mentions: 50 reviews mention savings with positive sentiment, 50 don't
Achievement Rate: 50/100 = 50%
Type Weight: 1.0 (Required)
Gains Score: 50 × 1.0 = 50/100`}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Statistical Significance */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Calculate color="primary" fontSize="large" />
              <Typography variant="h5" fontWeight="bold">
                Statistical Significance
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body1" paragraph>
              The platform calculates statistical significance based on sample size to indicate the
              confidence level of the audit results.
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F3E5F5', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Confidence Levels:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="≥ 385 reviews: 95% confidence"
                    secondary="Statistically significant at 95% confidence level (5% margin of error)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="≥ 200 reviews: 90% confidence"
                    secondary="Good confidence level with 10% margin of error"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="< 200 reviews: 85% confidence"
                    secondary="Lower confidence, results should be interpreted with caution"
                  />
                </ListItem>
              </List>
            </Paper>

            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> The minimum recommended sample size for statistical significance
                is 385 reviews (for 95% confidence, 5% margin of error). Smaller sample sizes may
                still provide valuable insights but with lower confidence levels.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Text Similarity Matching */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Text Similarity Matching
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body1" paragraph>
              The platform uses keyword-based text similarity to match company promises with customer feedback.
              This is a simplified approach for the MVP; future versions will use semantic similarity models.
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F5F5F5', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Current Method:
              </Typography>
              <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-line' }}>
                {`1. Extract words (length > 3 characters) from both texts
2. Find common words between promise and feedback
3. Similarity = Common Words / Max(Words in Promise, Words in Feedback)
4. Match if similarity > 0.5 (50%)`}
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

