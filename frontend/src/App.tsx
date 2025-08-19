import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtocolDetailPage } from './pages/ProtocolDetailPage';
import OpenProtocolsPage from './pages/OpenProtocolsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/protocol/:protocolId" element={<ProtocolDetailPage />} />
      <Route path="/protocol/:protocolId/instance/:instanceId" element={<ProtocolDetailPage />} />
      <Route path="/open-protocols" element={<OpenProtocolsPage />} />
      {/* Redirect any unknown path to the login page */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
