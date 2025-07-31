
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthProvider';
import { useContext } from 'react';


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (!user) {
return <Navigate to="/login" state={{ from: location }} replace />;

  }

  return children;
};

export default ProtectedRoute;
