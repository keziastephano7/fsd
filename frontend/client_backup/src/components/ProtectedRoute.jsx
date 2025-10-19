import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-lightGray text-darkText">
        <p className="text-lg text-muted">Redirecting to login...</p>
      </div>
    );
  }

  return children;
}
