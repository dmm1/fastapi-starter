import { useEffect } from 'react';
import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useAuthStore } from './stores/auth';

export function App() {
  const { restoreFromStorage } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from storage on app startup
    restoreFromStorage();
  }, []); // Empty dependency array - only run once on mount

  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}

export default App;
