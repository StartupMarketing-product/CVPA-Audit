import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { companiesApi, Company } from '../api/companies';
import { format, subDays } from 'date-fns';

const steps = ['Company Info', 'Data Sources', 'Time Period', 'Review'];

export default function AuditSetup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [sources, setSources] = useState<string[]>(['website', 'app_store', 'google_play']);
  const [timePeriod, setTimePeriod] = useState('90');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    if (id && id !== 'new') {
      loadCompany();
    }
  }, [id]);

  const loadCompany = async () => {
    try {
      const data = await companiesApi.getOne(id!);
      setCompany(data.company);
      setName(data.company.name);
      setIndustry(data.company.industry);
      setWebsiteUrl(data.company.website_url || '');
    } catch (error) {
      console.error('Failed to load company:', error);
    }
  };

  const handleNext = () => {
    setError('');
    if (activeStep === 0) {
      if (!name || !industry) {
        setError('Name and industry are required');
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSourceToggle = (source: string) => {
    setSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const getTimePeriodDates = () => {
    const end = new Date();
    let start: Date;

    switch (timePeriod) {
      case '30':
        start = subDays(end, 30);
        break;
      case '90':
        start = subDays(end, 90);
        break;
      case '180':
        start = subDays(end, 180);
        break;
      case '365':
        start = subDays(end, 365);
        break;
      case 'custom':
        return {
          start: customStart,
          end: customEnd,
        };
      default:
        start = subDays(end, 90);
    }

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      let companyId = id;

      // Create company if new
      if (id === 'new' || !id) {
        const newCompany = await companiesApi.create({ name, industry, website_url: websiteUrl });
        companyId = newCompany.id;
      }

      // Get time period dates
      const dates = getTimePeriodDates();

      // Start audit
      await companiesApi.startAudit(companyId!, {
        time_period_start: dates.start,
        time_period_end: dates.end,
        sources,
      });

      navigate(`/companies/${companyId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start audit');
    } finally {
      setLoading(false);
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
            Start New Audit
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Company Information
                </Typography>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  margin="normal"
                  required
                  disabled={!!company}
                />
                <TextField
                  fullWidth
                  label="Industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  margin="normal"
                  required
                  disabled={!!company}
                />
                <TextField
                  fullWidth
                  label="Website URL"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  margin="normal"
                  type="url"
                />
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Data Sources
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Select the data sources to collect from
                </Typography>
                <Box mt={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sources.includes('website')}
                        onChange={() => handleSourceToggle('website')}
                      />
                    }
                    label="Website"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sources.includes('app_store')}
                        onChange={() => handleSourceToggle('app_store')}
                      />
                    }
                    label="App Store (iOS)"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sources.includes('google_play')}
                        onChange={() => handleSourceToggle('google_play')}
                      />
                    }
                    label="Google Play"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sources.includes('yandex_maps')}
                        onChange={() => handleSourceToggle('yandex_maps')}
                      />
                    }
                    label="Yandex Maps/Places (Узбекистан)"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sources.includes('uzum')}
                        onChange={() => handleSourceToggle('uzum')}
                      />
                    }
                    label="Uzum (Узбекистан)"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sources.includes('social_media')}
                        onChange={() => handleSourceToggle('social_media')}
                      />
                    }
                    label="Social Media (Twitter, Facebook, Instagram, LinkedIn)"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sources.includes('media')}
                        onChange={() => handleSourceToggle('media')}
                      />
                    }
                    label="Media Articles (News, Interviews, Press Releases)"
                  />
                </Box>
              </Box>
            )}

            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Time Period
                </Typography>
                <Box>
                  <FormControlLabel
                    control={
                      <input
                        type="radio"
                        checked={timePeriod === '30'}
                        onChange={() => setTimePeriod('30')}
                        style={{ marginRight: 8 }}
                      />
                    }
                    label="Last 30 days"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <input
                        type="radio"
                        checked={timePeriod === '90'}
                        onChange={() => setTimePeriod('90')}
                        style={{ marginRight: 8 }}
                      />
                    }
                    label="Last 90 days"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <input
                        type="radio"
                        checked={timePeriod === '180'}
                        onChange={() => setTimePeriod('180')}
                        style={{ marginRight: 8 }}
                      />
                    }
                    label="Last 6 months"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <input
                        type="radio"
                        checked={timePeriod === '365'}
                        onChange={() => setTimePeriod('365')}
                        style={{ marginRight: 8 }}
                      />
                    }
                    label="Last 12 months"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <input
                        type="radio"
                        checked={timePeriod === 'custom'}
                        onChange={() => setTimePeriod('custom')}
                        style={{ marginRight: 8 }}
                      />
                    }
                    label="Custom range"
                  />
                  {timePeriod === 'custom' && (
                    <Box mt={2} ml={4}>
                      <TextField
                        label="Start Date"
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        sx={{ mr: 2 }}
                      />
                      <TextField
                        label="End Date"
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {activeStep === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Review
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Company:</strong> {name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Industry:</strong> {industry}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Sources:</strong> {sources.join(', ')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Time Period:</strong> {getTimePeriodDates().start} to {getTimePeriodDates().end}
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  The audit will process in the background. You'll be notified when it's complete.
                </Alert>
              </Box>
            )}

            <Box display="flex" justifyContent="space-between" mt={4}>
              <Button disabled={activeStep === 0} onClick={handleBack}>
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || sources.length === 0}
                >
                  {loading ? <CircularProgress size={24} /> : 'Start Audit'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

