import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './setup/logRuntimeErrors';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);