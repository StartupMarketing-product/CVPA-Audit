import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companiesApi } from '../api/companies';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import { ArrowBack, ExpandMore, CheckCircle, Cancel, Warning } from '@mui/icons-material';
import ScoreGauge from '../components/ScoreGauge';

interface KeyPoint {
  promise: {
    text: string;
    source_type: string;
    source_url?: string;
    job_type?: string;
    gain_type?: string;
    confidence: number;
  };
  customer_feedback: {
    mention_count: number;
    mention_percentage: number;
    sentiment_score: string;
    quotes: Array<{
      text: string;
      rating?: number;
      source: string;
      sentiment: number;
      date: string;
    }>;
  };
  fulfillment_status: 'fulfilled' | 'partial' | 'not_fulfilled';
}

interface DimensionData {
  score: number;
  key_points: KeyPoint[];
}

interface DetailedAudit {
  audit: any;
  scores: any;
  dimensions: {
    jobs_fulfillment: DimensionData;
    pain_relief: DimensionData;
    gain_achievement: DimensionData;
  };
}

export default function AuditDetailPage() {
  const { id, auditId } = useParams<{ id: string; auditId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState<DetailedAudit | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && auditId) {
      loadAuditDetail();
    }
  }, [id, auditId]);

  const loadAuditDetail = async () => {
    try {
      const data = await companiesApi.getDetailedAudit(id!, auditId!);
      setAuditData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit details');
      console.error('Failed to load audit details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFulfillmentIcon = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return <CheckCircle color="success" />;
      case 'partial':
        return <Warning color="warning" />;
      case 'not_fulfilled':
        return <Cancel color="error" />;
      default:
        return null;
    }
  };

  const getFulfillmentColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'fulfilled':
        return 'success';
      case 'partial':
        return 'warning';
      case 'not_fulfilled':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderDimensionSection = (
    title: string,
    dimension: DimensionData
  ) => {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h2">
              {title}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <ScoreGauge score={dimension.score} size={120} />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {dimension.key_points.length === 0 ? (
            <Alert severity="info">
              No specific promises identified for this dimension. The score is based on overall customer feedback analysis.
            </Alert>
          ) : (
            dimension.key_points.map((point, index) => (
              <Accordion key={index} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    {getFulfillmentIcon(point.fulfillment_status)}
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {point.promise.text}
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Chip
                          label={point.fulfillment_status.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={getFulfillmentColor(point.fulfillment_status)}
                        />
                        <Chip
                          label={`${point.customer_feedback.mention_percentage}% mention rate`}
                          size="small"
                          variant="outlined"
                        />
                        {point.promise.source_type && (
                          <Chip
                            label={point.promise.source_type}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {/* Promise Section */}
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#E3F2FD' }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                          COMPANY PROMISE
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {point.promise.text}
                        </Typography>
                        {point.promise.source_url && (
                          <Typography variant="caption" color="text.secondary">
                            Source: {point.promise.source_url}
                          </Typography>
                        )}
                        {point.promise.job_type && (
                          <Chip
                            label={`Job Type: ${point.promise.job_type}`}
                            size="small"
                            sx={{ mt: 1, mr: 1 }}
                          />
                        )}
                        {point.promise.gain_type && (
                          <Chip
                            label={`Gain Type: ${point.promise.gain_type}`}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Paper>
                    </Grid>

                    {/* Customer Feedback Section */}
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#FFF3E0' }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="warning.main">
                          CUSTOMER REALITY
                        </Typography>
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary">
                            Mentioned in {point.customer_feedback.mention_count} reviews ({point.customer_feedback.mention_percentage}% of total)
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Average Sentiment: {point.customer_feedback.sentiment_score}
                          </Typography>
                        </Box>

                        <Typography variant="subtitle2" gutterBottom>
                          Customer Feedback Quotes:
                        </Typography>
                        {point.customer_feedback.quotes.length > 0 ? (
                          point.customer_feedback.quotes.map((quote, qIndex) => (
                            <Box key={qIndex} mb={2} p={1.5} bgcolor="white" borderRadius={1}>
                              <Typography variant="body2" paragraph>
                                "{quote.text}"
                              </Typography>
                              <Box display="flex" gap={1} flexWrap="wrap">
                                {quote.rating && (
                                  <Chip
                                    label={`${quote.rating} ⭐`}
                                    size="small"
                                    color={quote.rating >= 4 ? 'success' : quote.rating >= 3 ? 'warning' : 'error'}
                                  />
                                )}
                                <Chip label={quote.source} size="small" variant="outlined" />
                                <Chip
                                  label={new Date(quote.date).toLocaleDateString()}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No specific feedback matching this promise found in reviews.
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Detailed Audit Analysis
            </Typography>
          </Toolbar>
        </AppBar>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (error || !auditData) {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Detailed Audit Analysis
            </Typography>
          </Toolbar>
        </AppBar>
        <Container>
          <Alert severity="error" sx={{ mt: 4 }}>
            {error || 'Failed to load audit details'}
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Detailed Audit Analysis
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Overview */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" gutterBottom>
                  Audit Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Audit Date: {new Date(auditData.audit.created_at).toLocaleDateString()}
                </Typography>
                {auditData.scores && (
                  <Typography variant="body2" color="text.secondary">
                    Sample Size: {auditData.scores.sample_size} reviews | Confidence: {(auditData.scores.statistical_significance * 100).toFixed(0)}%
                  </Typography>
                )}
              </Box>
              {auditData.scores && (
                <Box>
                  <ScoreGauge score={auditData.scores.overall_score} size={150} />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Dimension Details */}
        {renderDimensionSection(
          'Jobs Fulfillment',
          auditData.dimensions.jobs_fulfillment
        )}

        {renderDimensionSection(
          'Pain Relief',
          auditData.dimensions.pain_relief
        )}

        {renderDimensionSection(
          'Gain Achievement',
          auditData.dimensions.gain_achievement
        )}
      </Container>
    </>
  );
}

