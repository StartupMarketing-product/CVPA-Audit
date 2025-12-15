import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { companiesApi } from '../api/companies';

export default function CompanyNew() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [appStoreId, setAppStoreId] = useState('');
  const [googlePlayPackage, setGooglePlayPackage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const company = await companiesApi.create({
        name,
        industry,
        website_url: websiteUrl || undefined,
        description: description || undefined,
        app_store_id: appStoreId || undefined,
        google_play_package: googlePlayPackage || undefined,
      });
      navigate(`/companies/${company.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Add New Company
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Company Information
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Company Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                margin="normal"
                required
                placeholder="e.g., SaaS, E-commerce, Healthcare"
              />
              <TextField
                fullWidth
                label="Website URL"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                margin="normal"
                type="url"
                placeholder="https://example.com"
              />
              <TextField
                fullWidth
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                margin="normal"
                multiline
                rows={4}
              />
              <TextField
                fullWidth
                label="App Store ID (Optional)"
                value={appStoreId}
                onChange={(e) => setAppStoreId(e.target.value)}
                margin="normal"
                placeholder="e.g., 1454827930"
                helperText="Numeric ID from App Store URL (apps.apple.com/app/id...)"
              />
              <TextField
                fullWidth
                label="Google Play Package Name (Optional)"
                value={googlePlayPackage}
                onChange={(e) => setGooglePlayPackage(e.target.value)}
                margin="normal"
                placeholder="e.g., com.korzinka.app"
                helperText="Package name from Google Play Store"
              />

              <Box display="flex" gap={2} mt={3}>
                <Button variant="outlined" onClick={() => navigate('/')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !name || !industry}
                >
                  {loading ? 'Creating...' : 'Create Company'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

