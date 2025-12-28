import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './components/pages/Dashboard';

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <DashboardProvider>
          <Routes>
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DashboardProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
