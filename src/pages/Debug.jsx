import React from 'react';
import { useLocation } from 'react-router-dom';

export default function Debug() {
  const location = useLocation();
  return (
    <div className="p-6 text-center">
      <div className="inline-block bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3">
        ✅ Router is working correctly!
        <div className="mt-2 text-sm">
          <p>Current URL: <code className="bg-green-100 px-1 rounded">{location.pathname}</code></p>
          <p className="mt-1 text-xs opacity-70">This debug page confirms routing and lazy loading are functional</p>
        </div>
      </div>
    </div>
  );
}