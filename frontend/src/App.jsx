import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import DocumentsPage from './pages/DocumentsPage';
import ExpensesPage from './pages/ExpensesPage';
import AlertsPage from './pages/AlertsPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f0eb' }}>
      <div className="flex flex-col items-center gap-3">
        <div style={{ width:40,height:40,borderRadius:12,background:'#b9ff66',border:'2px solid #1a1a1a',boxShadow:'3px 3px 0 #1a1a1a',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <span style={{ fontSize:14,fontWeight:900,color:'#1a1a1a' }}>CV</span>
        </div>
        <span style={{ fontSize:12,fontWeight:700,color:'#6b6b6b' }}>Chargement...</span>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f0eb' }}>
      <div style={{ width:40,height:40,borderRadius:12,background:'#b9ff66',border:'2px solid #1a1a1a',boxShadow:'3px 3px 0 #1a1a1a',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <span style={{ fontSize:14,fontWeight:900,color:'#1a1a1a' }}>CV</span>
      </div>
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
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
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/logout" element={<LogoutRoute />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="alerts" element={<AlertsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
