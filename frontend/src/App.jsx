import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes/AppRoutes';
import { ThemeProvider } from './features/ThemeContext';
import { subscribeToLiveVehicles } from './services/socket';
import { initGlobalTacticalSync } from './services/tacticalSync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
      retry: 1
    }
  }
});

export function App() {
  useEffect(() => {
    // Subscribe to real-time socket & tactical broadcast events
    const unsubSocket = subscribeToLiveVehicles(queryClient);
    const unsubTactical = initGlobalTacticalSync(queryClient);

    return () => {
      if (unsubSocket) unsubSocket();
      if (unsubTactical) unsubTactical();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
