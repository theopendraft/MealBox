// src/routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/auth" />;
  }

  return (
    <Layout>
      <ErrorBoundary key={typeof children?.type === 'function' ? children.type.name : undefined}>
        {children}
      </ErrorBoundary>
    </Layout>
  );
}
