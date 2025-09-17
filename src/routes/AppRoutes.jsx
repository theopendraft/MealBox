// src/routes/AppRoutes.jsx
import { Route, Routes } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';
import LandingPage from '../pages/LandingPage';
import DashboardPage from '../pages/DashboardPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import UserProfile from '../pages/UserProfile';
import ProtectedRoute from './ProtectedRoute'; // 1. Import ProtectedRoute
import ClientListPage from '../pages/ClientListPage';
import ClientDetailPage from '../pages/ClientDetailPage';
import DailyDeliveryPage from '../pages/DailyDeliveryPage';
import BillingPage from '../pages/BillingPage';
import GenerateBillPage from '../pages/GenerateBillPage';
import BillDetailPage from '../pages/BillDetailPage';


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<AuthPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><ClientListPage /></ProtectedRoute>} />
      <Route path="/clients/:clientId" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute><DailyDeliveryPage /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/bills/:billId" element={<ProtectedRoute><BillDetailPage /></ProtectedRoute>} />
      <Route
        path="/clients/:clientId/generate-bill"
        element={<ProtectedRoute><GenerateBillPage /></ProtectedRoute>}
      />
    </Routes>
  );
} 