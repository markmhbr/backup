import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { getRoleSlug } from '../../services/roleUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // Jika tidak punya akses ke role ini, arahkan ke dashboard role miliknya sendiri
    return <Navigate to={`/${getRoleSlug(user.role)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
