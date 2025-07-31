import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';

const LogOut = () => {
  const { logOut } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      await logOut();
      navigate('/login');
    };
    performLogout();
  }, [logOut, navigate]);

  return <div>Logging out...</div>;
};

export default LogOut;
