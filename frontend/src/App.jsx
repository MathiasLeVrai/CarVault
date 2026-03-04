import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import DocumentsPage from './pages/DocumentsPage';
import ExpensesPage from './pages/ExpensesPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import SharePage from './pages/SharePage';
import MapPage from './pages/MapPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(230,57,70,0.3)]">
          <span className="text-sm font-black text-white font-display">CV</span>
        </div>
        <span className="text-xs font-semibold text-ink-muted">Chargement...</span>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(230,57,70,0.3)]">
        <span className="text-sm font-black text-white font-display">CV</span>
      </div>
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function LandingRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(230,57,70,0.3)]">
        <span className="text-sm font-black text-white font-display">CV</span>
      </div>
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function LogoutRoute() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    logout();
    navigate('/login', { replace: true });
  }, []);
  return null;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/logout" element={<LogoutRoute />} />
      <Route path="/share/:token" element={<SharePage />} />
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="map" element={<MapPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
