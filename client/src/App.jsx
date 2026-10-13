import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';
import { AuctionSocketProvider } from './context/AuctionSocketContext';
import MainLayout from './layouts/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import LiveAuctionPage from './pages/LiveAuctionPage';
import TeamsPage from './pages/TeamsPage';
import PlayersPage from './pages/PlayersPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SoundProvider>
          <AuctionSocketProvider>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/live" element={<LiveAuctionPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/players" element={<PlayersPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </AuctionSocketProvider>
        </SoundProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
