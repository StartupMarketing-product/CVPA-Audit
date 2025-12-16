import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import { ArrowBack, CheckCircle, Error } from '@mui/icons-material';
import { companiesApi } from '../api/companies';

interface ReviewSource {
  source: string;
  count: number;
  verified_count: number;
  avg_rating: string | null;
  earliest_review: string | null;
  latest_review: string | null;
}

interface RawDataSource {
  source_type: string;
  count: number;
  processed_count: number;
  failed_count: number;
}

export default function DataSourcesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reviewSources, setReviewSources] = useState<ReviewSource[]>([]);
  const [rawDataSources, setRawDataSources] = useState<RawDataSource[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const data = await companiesApi.getDataSources(id!);
      setReviewSources(data.review_sources);
      setRawDataSources(data.raw_data_sources);
      setTotals(data.totals);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data sources');
      console.error('Failed to load data sources:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSourceDisplayName = (source: string): string => {
    const sourceNames: Record<string, string> = {
      'app_store': 'App Store (iOS)',
      'google_play': 'Google Play',
      'yandex_maps': 'Yandex Maps/Places',
      'uzum': 'Uzum',
      'website': 'Website',
      'review_site': 'Review Sites',
      'social_media': 'Social Media',
      'media': 'Media Articles',
    };
    return sourceNames[source] || source;
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('app_store') || source.includes('google_play')) {
      return '📱';
    }
    if (source.includes('yandex')) {
      return '🗺️';
    }
    if (source.includes('uzum')) {
      return '🛒';
    }
    return '📊';
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
              Data Sources
            </Typography>
          </Toolbar>
        </AppBar>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
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
            Data Collection Status
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        {totals && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" component="div" color="primary">
                    {totals.total_reviews}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Reviews
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" component="div" color="primary">
                    {totals.unique_sources}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Data Sources
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" component="div" color="primary">
                    {totals.total_verified}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verified Reviews
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" component="div" color="primary">
                    {totals.overall_avg_rating || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Review Sources Table */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Review Sources
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Breakdown of reviews collected from each source
            </Typography>

            {reviewSources.length === 0 ? (
              <Alert severity="info">
                No reviews collected yet. Run an audit to collect reviews from selected sources.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Source</strong></TableCell>
                      <TableCell align="right"><strong>Total Reviews</strong></TableCell>
                      <TableCell align="right"><strong>Verified</strong></TableCell>
                      <TableCell align="right"><strong>Avg Rating</strong></TableCell>
                      <TableCell><strong>Date Range</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reviewSources.map((source) => (
                      <TableRow key={source.source} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <span>{getSourceIcon(source.source)}</span>
                            <Typography variant="body1">
                              {getSourceDisplayName(source.source)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="medium">
                            {source.count.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                            {source.verified_count > 0 && <CheckCircle fontSize="small" color="success" />}
                            <Typography variant="body2">
                              {source.verified_count} ({source.count > 0 ? Math.round((source.verified_count / source.count) * 100) : 0}%)
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {source.avg_rating ? (
                            <Chip
                              label={`${source.avg_rating} ⭐`}
                              size="small"
                              color={parseFloat(source.avg_rating) >= 4 ? 'success' : parseFloat(source.avg_rating) >= 3 ? 'warning' : 'error'}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {source.earliest_review && source.latest_review ? (
                            <Typography variant="body2">
                              {new Date(source.earliest_review).toLocaleDateString()} - {new Date(source.latest_review).toLocaleDateString()}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Raw Data Sources */}
        {rawDataSources.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Company Communications
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                Data collected from company websites, social media, and media articles
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Source Type</strong></TableCell>
                      <TableCell align="right"><strong>Total Items</strong></TableCell>
                      <TableCell align="right"><strong>Processed</strong></TableCell>
                      <TableCell align="right"><strong>Failed</strong></TableCell>
                      <TableCell align="right"><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rawDataSources.map((source) => {
                      const successRate = source.count > 0 
                        ? Math.round((source.processed_count / source.count) * 100) 
                        : 0;
                      return (
                        <TableRow key={source.source_type} hover>
                          <TableCell>
                            <Typography variant="body1">
                              {getSourceDisplayName(source.source_type)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="medium">
                              {source.count.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                              <CheckCircle fontSize="small" color="success" />
                              <Typography variant="body2">
                                {source.processed_count}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {source.failed_count > 0 ? (
                              <Box>
                                <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                                  <Error fontSize="small" color="error" />
                                  <Typography variant="body2" color="error">
                                    {source.failed_count}
                                  </Typography>
                                </Box>
                                {(source as any).sample_error && (
                                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                                    Error: {(source as any).sample_error}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">0</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${successRate}%`}
                              size="small"
                              color={successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'error'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Container>
    </>
  );
}

