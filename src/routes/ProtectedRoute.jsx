// src/routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import { AppShellSkeleton } from '../components/ui/Skeleton';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const { settings, loading } = useSettings();

  if (!currentUser) {
    return <Navigate to="/auth" />;
  }

  if (loading) {
    return <AppShellSkeleton />;
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
