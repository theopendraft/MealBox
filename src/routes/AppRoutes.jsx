// src/routes/AppRoutes.jsx
import { Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ProtectedRoute from './ProtectedRoute'; // 1. Import ProtectedRoute
import ClientListPage from '../pages/ClientListPage';
import ClientDetailPage from '../pages/ClientDetailPage';
import DailyDeliveryPage from '../pages/DailyDeliveryPage';
import BillingPage from '../pages/BillingPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><ClientListPage /></ProtectedRoute>} />
      <Route path="/clients/:clientId" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute><DailyDeliveryPage /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
    </Routes>
  );
}