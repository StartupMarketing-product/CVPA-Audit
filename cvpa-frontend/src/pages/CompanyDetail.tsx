import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import { ArrowBack, Assessment, TrendingUp, DataObject, Description, Info } from '@mui/icons-material';
import { companiesApi, Company, AuditScore } from '../api/companies';
import ScoreGauge from '../components/ScoreGauge';
import DimensionScoreBar from '../components/DimensionScoreBar';

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [score, setScore] = useState<AuditScore | null>(null);
  const [latestAuditId, setLatestAuditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const data = await companiesApi.getOne(id!);
      setCompany(data.company);
      setScore(data.latest_score);

      // Get latest audit ID
      try {
        const auditsResponse = await fetch(`/api/v1/companies/${id}/audits`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (auditsResponse.ok) {
          const auditsData = await auditsResponse.json();
          const latestCompletedAudit = auditsData.audits?.find((a: any) => a.status === 'completed');
          if (latestCompletedAudit) {
            setLatestAuditId(latestCompletedAudit.id);
          }
        }
      } catch (err) {
        console.error('Failed to load audits:', err);
      }
    } catch (error) {
      console.error('Failed to load company:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (!company) {
    return (
      <Container>
        <Alert severity="error">Company not found</Alert>
      </Container>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {company.name}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box mb={3}>
          <Typography variant="h4" gutterBottom>
            {company.name}
          </Typography>
          <Chip label={company.industry} sx={{ mr: 1 }} />
          {company.website_url && (
            <Chip label={company.website_url} variant="outlined" />
          )}
        </Box>

        {score ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom align="center">
                    Overall Score
                  </Typography>
                  <Box display="flex" justifyContent="center" mt={2}>
                    <ScoreGauge score={score.overall_score} size={200} />
                  </Box>
                  <Box mt={3} textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      Sample Size: {score.sample_size} reviews
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Confidence: {(score.statistical_significance * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Score Breakdown
                  </Typography>
                  <Box mt={3}>
                    <DimensionScoreBar
                      label="Jobs Fulfillment"
                      score={score.jobs_score}
                      weight={0.4}
                    />
                    <DimensionScoreBar
                      label="Pain Relief"
                      score={score.pains_score}
                      weight={0.3}
                    />
                    <DimensionScoreBar
                      label="Gain Achievement"
                      score={score.gains_score}
                      weight={0.3}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} flexWrap="wrap">
                {latestAuditId && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Description />}
                    onClick={() => navigate(`/companies/${id}/audits/${latestAuditId}/detailed`)}
                  >
                    View Detailed Analysis
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  onClick={() => navigate(`/companies/${id}/gaps`)}
                >
                  View Gap Analysis
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DataObject />}
                  onClick={() => navigate(`/companies/${id}/data-sources`)}
                >
                  View Data Sources
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<TrendingUp />}
                  onClick={() => navigate(`/companies/${id}/audit/new`)}
                >
                  Run New Audit
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Info />}
                  onClick={() => navigate('/scoring-methodology')}
                >
                  How Scores Work
                </Button>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No audit data yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Run your first audit to see scores and insights
              </Typography>
              <Button
                variant="contained"
                startIcon={<Assessment />}
                onClick={() => navigate(`/companies/${id}/audit/new`)}
              >
                Start Audit
              </Button>
            </CardContent>
          </Card>
        )}
      </Container>
    </>
  );
}

