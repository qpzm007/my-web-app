import React from 'react';
import { AppProvider, useAppContext } from './store/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/auth/Login';
import WorkerApp from './components/worker/WorkerApp';
import AdminDashboard from './components/admin/AdminDashboard';

function MainAppRouter() {
  const { currentUser } = useAppContext();

  if (!currentUser) return <Login />;
  if (currentUser.role === 'worker') return <WorkerApp />;
  return <AdminDashboard />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainAppRouter />
      </AppProvider>
    </ErrorBoundary>
  );
}
