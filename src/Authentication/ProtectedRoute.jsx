
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthProvider';
import { useContext } from 'react';


const ProtectedRoute = ({ children }) => {
  const { user, loading, isSuspended, logOut } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (!user) {
return <Navigate to="/login" state={{ from: location }} replace />;

  }

  if (isSuspended) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h1 className="text-2xl font-bold text-error">Account suspended</h1>
            <p className="text-base-content/70">
              Your account has been suspended by an administrator. Please contact support.
            </p>
            <div className="card-actions justify-center mt-4">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => logOut?.()}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
