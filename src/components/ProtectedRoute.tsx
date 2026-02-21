import { Navigate } from 'react-router-dom';
import { useStudentAuth } from '@/context/StudentAuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, loading } = useStudentAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
