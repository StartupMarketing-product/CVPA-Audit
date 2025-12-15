import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CompanyDetail from './pages/CompanyDetail';
import AuditSetup from './pages/AuditSetup';
import GapAnalysis from './pages/GapAnalysis';
import CompanyNew from './pages/CompanyNew';
import DataSources from './pages/DataSources';
import AuditDetail from './pages/AuditDetail';
import ScoringMethodology from './pages/ScoringMethodology';
import { AuthProvider, useAuth } from './context/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563EB',
    },
    secondary: {
      main: '#10B981',
    },
    error: {
      main: '#EF4444',
    },
    warning: {
      main: '#F59E0B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/companies/new"
              element={
                <PrivateRoute>
                  <CompanyNew />
                </PrivateRoute>
              }
            />
            <Route
              path="/companies/:id"
              element={
                <PrivateRoute>
                  <CompanyDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/companies/:id/audit/new"
              element={
                <PrivateRoute>
                  <AuditSetup />
                </PrivateRoute>
              }
            />
            <Route
              path="/companies/:id/gaps"
              element={
                <PrivateRoute>
                  <GapAnalysis />
                </PrivateRoute>
              }
            />
            <Route
              path="/companies/:id/data-sources"
              element={
                <PrivateRoute>
                  <DataSources />
                </PrivateRoute>
              }
            />
            <Route
              path="/companies/:id/audits/:auditId/detailed"
              element={
                <PrivateRoute>
                  <AuditDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/scoring-methodology"
              element={
                <PrivateRoute>
                  <ScoringMethodology />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

