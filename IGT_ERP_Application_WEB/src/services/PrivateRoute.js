import React, { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AuthContext from '../services/AuthContext';

const PrivateRoute = ({ ...rest }) => {
  const { user } = useContext(AuthContext);

  // Check if the user is authenticated
  const isAuthenticated = !!user && !!user.jti;
  // localStorage.removeItem('authTokens');
  
  return isAuthenticated ? (
    <Outlet {...rest} />
  ) : (
    // Redirect to the login page if the user is not authenticated
    <Navigate to="/" />
  );
};

export default PrivateRoute;
