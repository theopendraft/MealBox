// src/routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const { settings, loading } = useSettings();

  if (!currentUser) {
    return <Navigate to="/auth" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!settings.setupComplete) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <Layout>
      <ErrorBoundary key={typeof children?.type === 'function' ? children.type.name : undefined}>
        {children}
      </ErrorBoundary>
    </Layout>
  );
}
