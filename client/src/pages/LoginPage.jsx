import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Shield, Users, LogIn, Key, Mail, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [showDemoAccounts, setShowDemoAccounts] = useState(
    import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true' || import.meta.env.DEV
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (user.globalRole === 'superadmin' || user.globalRole === 'auctioneer') {
        navigate('/admin');
      } else if (user.globalRole === 'team_owner') {
        navigate('/owner/dashboard');
      } else {
        navigate('/live');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchDemos = async () => {
      try {
        const res = await api.get('/auth/demo-accounts');
        if (res.data?.success) {
          setDemoAccounts(res.data.demoAccounts || []);
        }
      } catch (err) {
        // Fallback demo accounts for Maidan ke Sultan
        setDemoAccounts([
          { name: 'Tournament Director', email: 'admin@mks.edu', role: 'superadmin', defaultPassword: 'Admin@123456' },
          { name: 'Charu Sharma (Auctioneer)', email: 'auctioneer@mks.edu', role: 'auctioneer', defaultPassword: 'Auctioneer@123456' },
          { name: 'Jeb Katre Owner', email: 'jebkatre@mks.edu', role: 'team_owner', teamName: 'Jeb Katre', defaultPassword: 'Owner@123456' },
          { name: 'Maqsad XI Owner', email: 'maqsad@mks.edu', role: 'team_owner', teamName: 'Maqsad XI', defaultPassword: 'Owner@123456' },
          { name: 'Khalnayak XI Owner', email: 'khalnayak@mks.edu', role: 'team_owner', teamName: 'Khalnayak XI', defaultPassword: 'Owner@123456' },
          { name: 'Phurtile Sher Owner', email: 'phurtile@mks.edu', role: 'team_owner', teamName: 'Phurtile Sher', defaultPassword: 'Owner@123456' },
          { name: 'Dhurandar XI Owner', email: 'dhurandar@mks.edu', role: 'team_owner', teamName: 'Dhurandar XI', defaultPassword: 'Owner@123456' },
        ]);
      }
    };
    fetchDemos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Navigation handled by useEffect
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.defaultPassword || 'Owner@123456');
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="md:col-span-6 glass-panel p-8 rounded-3xl border border-cpl-border shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cpl-gold to-cpl-gold-dark p-0.5 mx-auto shadow-gold">
              <div className="w-full h-full bg-cpl-dark rounded-[14px] flex items-center justify-center">
                <Trophy className="w-7 h-7 text-cpl-gold" />
              </div>
            </div>
            <h2 className="font-display font-black text-2xl text-white">Authorized Sign In</h2>
            <p className="text-xs text-slate-400">
              Access live bidding controls, franchise portals, or tournament administration.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cpl.edu / owner@cpl.edu"
                  className="w-full bg-cpl-surface border border-cpl-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-cpl-surface border border-cpl-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gold-gradient-btn py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-gold transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In To Dashboard'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
