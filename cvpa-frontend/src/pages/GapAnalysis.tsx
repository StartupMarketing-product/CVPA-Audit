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
  Chip,
  Alert,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import { ArrowBack, Warning, Error, Info, CheckCircle, Cancel } from '@mui/icons-material';
import { companiesApi, GapAnalysis } from '../api/companies';

export default function GapAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [gaps, setGaps] = useState<GapAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadGaps();
    }
  }, [id]);

  const loadGaps = async () => {
    try {
      // Get all audits for this company
      const auditsData = await companiesApi.getAudits(id!);
      const audits = auditsData.audits || [];
      
      // Find the latest completed audit
      const latestCompletedAudit = audits.find((a: any) => a.status === 'completed');
      
      if (latestCompletedAudit) {
        // Get gaps from the latest audit
        const auditData = await companiesApi.getAudit(id!, latestCompletedAudit.id);
        console.log('Loaded gaps:', auditData.gaps);
        setGaps(auditData.gaps || []);
      } else {
        console.log('No completed audit found');
        setGaps([]);
      }
    } catch (error) {
      console.error('Failed to load gaps:', error);
      setGaps([]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'high':
        return <Warning color="warning" />;
      case 'medium':
        return <Warning color="warning" />;
      default:
        return <Info color="info" />;
    }
  };

  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' | 'default' => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gap Analysis
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : gaps.length === 0 ? (
          <Alert severity="info">
            No gaps identified. This could mean either the company has excellent alignment,
            or an audit needs to be completed first.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {gaps.map((gap) => (
              <Grid item xs={12} key={gap.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      {getSeverityIcon(gap.gap_severity)}
                      <Typography variant="h6">{gap.gap_description}</Typography>
                      <Chip
                        label={gap.gap_severity.toUpperCase()}
                        color={getSeverityColor(gap.gap_severity)}
                        size="small"
                      />
                      <Chip
                        label={`Impact: ${Math.round(gap.impact_score)}%`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={2} mt={2}>
                      {/* PROMISED Section */}
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#E3F2FD', height: '100%' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <CheckCircle color="primary" fontSize="small" />
                            <Typography variant="subtitle1" fontWeight="bold" color="primary">
                              PROMISED (Company Communication)
                            </Typography>
                          </Box>
                          
                          {(gap as any).detailed_promises && (gap as any).detailed_promises.length > 0 ? (
                            <List dense>
                              {(gap as any).detailed_promises.slice(0, 5).map((promise: any, idx: number) => (
                                <Box key={idx}>
                                  <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                      primary={
                                        <Box>
                                          <Typography variant="body2" component="span" fontWeight="medium">
                                            {idx + 1}. {promise.text}
                                          </Typography>
                                          {promise.source_type && (
                                            <Chip
                                              label={promise.source_type}
                                              size="small"
                                              sx={{ ml: 1, mt: 0.5 }}
                                              variant="outlined"
                                            />
                                          )}
                                        </Box>
                                      }
                                      secondary={
                                        promise.source_url && (
                                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                            Source: {promise.source_url.substring(0, 60)}...
                                          </Typography>
                                        )
                                      }
                                    />
                                  </ListItem>
                                  {idx < (gap as any).detailed_promises.length - 1 && idx < 4 && <Divider />}
                                </Box>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" sx={{ pl: 2, borderLeft: '3px solid #3B82F6' }}>
                              {gap.promise_text}
                            </Typography>
                          )}
                        </Paper>
                      </Grid>

                      {/* REALITY Section */}
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#FFF3E0', height: '100%' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <Cancel color="error" fontSize="small" />
                            <Typography variant="subtitle1" fontWeight="bold" color="error">
                              REALITY (Customer Feedback - Not Delivered)
                            </Typography>
                          </Box>
                          
                          {(gap as any).detailed_reality && (gap as any).detailed_reality.length > 0 ? (
                            <List dense>
                              {(gap as any).detailed_reality.slice(0, 5).map((reality: any, idx: number) => (
                                <Box key={idx}>
                                  <ListItem sx={{ px: 0, py: 1 }}>
                                    <ListItemText
                                      primary={
                                        <Box>
                                          <Typography variant="body2" component="span" fontWeight="medium">
                                            {idx + 1}. {reality.issue || 'Issue identified'}
                                          </Typography>
                                          {reality.rating && (
                                            <Chip
                                              label={`${reality.rating} ⭐`}
                                              size="small"
                                              sx={{ ml: 1, mt: 0.5 }}
                                              color={reality.rating >= 4 ? 'success' : reality.rating >= 3 ? 'warning' : 'error'}
                                            />
                                          )}
                                          {reality.source && (
                                            <Chip
                                              label={reality.source}
                                              size="small"
                                              sx={{ ml: 1, mt: 0.5 }}
                                              variant="outlined"
                                            />
                                          )}
                                        </Box>
                                      }
                                      secondary={
                                        <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                          "{reality.text?.substring(0, 150)}{reality.text?.length > 150 ? '...' : ''}"
                                        </Typography>
                                      }
                                    />
                                  </ListItem>
                                  {idx < (gap as any).detailed_reality.length - 1 && idx < 4 && <Divider />}
                                </Box>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" sx={{ pl: 2, borderLeft: '3px solid #EF4444' }}>
                              {gap.reality_text}
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}

