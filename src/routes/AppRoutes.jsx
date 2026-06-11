// src/routes/AppRoutes.jsx
import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';
import DashboardPage from '../pages/DashboardPage';
import UserProfile from '../pages/UserProfile';
import SettingsPage from '../pages/SettingsPage';
import ProtectedRoute from './ProtectedRoute';
import ClientListPage from '../pages/ClientListPage';
import ClientDetailPage from '../pages/ClientDetailPage';
import KitchenPage from '../pages/KitchenPage';
import DeliveryRoutePage from '../pages/DeliveryRoutePage';
import CustomerLedgerPage from '../pages/CustomerLedgerPage';
import BroadcastPage from '../pages/BroadcastPage';
import BillingPage from '../pages/BillingPage';
import GenerateBillPage from '../pages/GenerateBillPage';
import BillDetailPage from '../pages/BillDetailPage';
import LandingPage from '../pages/LandingPage1';
import { useAuth } from '../context/AuthContext';

// If logged in, skip the landing page and go straight to dashboard
function RootRoute() {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
  </div>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />

      <Route path="/login" element={<AuthPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/analytics" element={
        <ProtectedRoute>
          <Suspense fallback={<Spinner />}>
            <AnalyticsPage />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><ClientListPage /></ProtectedRoute>} />
      <Route path="/clients/:clientId" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
      <Route path="/clients/:clientId/ledger" element={<ProtectedRoute><CustomerLedgerPage /></ProtectedRoute>} />
      <Route path="/broadcast" element={<ProtectedRoute><BroadcastPage /></ProtectedRoute>} />
      <Route path="/kitchen" element={<ProtectedRoute><KitchenPage /></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute><DeliveryRoutePage /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/bills/:billId" element={<ProtectedRoute><BillDetailPage /></ProtectedRoute>} />
      <Route
        path="/clients/:clientId/generate-bill"
        element={<ProtectedRoute><GenerateBillPage /></ProtectedRoute>}
      />
    </Routes>
  );
}
