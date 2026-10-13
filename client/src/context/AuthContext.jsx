import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { refreshSocketAuth } from '../socket/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [assignedTeam, setAssignedTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('cpl_auth_token');
      if (!token) {
        setUser(null);
        setMemberships([]);
        setAssignedTeam(null);
        setLoading(false);
        return;
      }

      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.user);
        setMemberships(res.data.memberships || []);
        setAssignedTeam(res.data.assignedTeam || null);
      }
    } catch (err) {
      console.warn('Authentication token expired or invalid:', err.message);
      localStorage.removeItem('cpl_auth_token');
      setUser(null);
      setMemberships([]);
      setAssignedTeam(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.token) {
      localStorage.setItem('cpl_auth_token', res.data.token);
      setUser(res.data.user);
      setMemberships(res.data.memberships || []);
      refreshSocketAuth();
      await fetchProfile();
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('cpl_auth_token');
    setUser(null);
    setMemberships([]);
    setAssignedTeam(null);
    refreshSocketAuth();
  };

  const isSuperAdmin = user?.globalRole === 'superadmin';
  const isAuctioneer = user?.globalRole === 'auctioneer' || isSuperAdmin;
  const isTeamOwner = user?.globalRole === 'team_owner' || !!assignedTeam;

  return (
    <AuthContext.Provider
      value={{
        user,
        memberships,
        assignedTeam,
        loading,
        isSuperAdmin,
        isAuctioneer,
        isTeamOwner,
        login,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
