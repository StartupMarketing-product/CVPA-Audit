import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Add, Logout, AccountCircle, Info } from '@mui/icons-material';
import { companiesApi, Company } from '../api/companies';
import { useAuth } from '../context/AuthContext';
import ScoreGauge from '../components/ScoreGauge';

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await companiesApi.getAll();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CVPA - Customer Value Proposition Audit
          </Typography>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <AccountCircle />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem disabled>{user?.email}</MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Companies
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Info />}
              onClick={() => navigate('/scoring-methodology')}
            >
              How Scores Work
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/companies/new')}
            >
              Add Company
            </Button>
          </Box>
        </Box>

        {companies.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No companies yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Get started by adding your first company
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/companies/new')}>
                Add Company
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {companies.map((company) => (
              <Grid item xs={12} sm={6} md={4} key={company.id}>
                <CompanyCard company={company} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const [score, setScore] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadScore();
  }, [company.id]);

  const loadScore = async () => {
    try {
      const data = await companiesApi.getOne(company.id);
      if (data.latest_score) {
        setScore(data.latest_score.overall_score);
      }
    } catch (error) {
      console.error('Failed to load score:', error);
    }
  };

  return (
    <Card
      sx={{ cursor: 'pointer', height: '100%' }}
      onClick={() => navigate(`/companies/${company.id}`)}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {company.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {company.industry}
        </Typography>
        {score !== null && (
          <Box mt={2}>
            <ScoreGauge score={score} size={100} />
          </Box>
        )}
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/companies/${company.id}/audit/new`);
          }}
        >
          Start Audit
        </Button>
      </CardContent>
    </Card>
  );
}

