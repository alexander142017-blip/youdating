import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getCurrentUser } from '../api/auth';

export function PrivateRoute({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const u = await getCurrentUser();
      if (!active) return;
      setUser(u);
      setReady(true);
    })();
    return () => { active = false; };
  }, []);

  if (!ready) return <div className="p-8 text-sm opacity-70">Checking session…</div>;
  if (!user) return <Navigate to="/auth/sign-in" replace />;
  return children;
}

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};