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

        {/* Right Column: Official Tournament Portal & Optional Demo Access */}
        <div className="md:col-span-6 glass-panel p-6 rounded-3xl border border-cpl-border space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cpl-gold" />
              <h3 className="font-display font-extrabold text-base text-white">
                Official Access Portal
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-cpl-gold/10 hover:bg-cpl-gold/20 text-cpl-gold border border-cpl-gold/30 transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>{showDemoAccounts ? 'Hide Demo Logins' : 'Show Demo Logins'}</span>
            </button>
          </div>

          {!showDemoAccounts ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cpl-surface/80 border border-cpl-border/80 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Maidan ke Sultan — 5 Franchises</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Authorized team owners can log in using their registered team credentials to place live real-time bids, manage squad allocations, and review purse balance.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="px-2.5 py-1.5 rounded-lg bg-cpl-dark/80 border border-red-500/20 text-red-300 font-bold">
                    🏏 Jeb Katre
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-cpl-dark/80 border border-emerald-500/20 text-emerald-300 font-bold">
                    🏏 Maqsad XI
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-cpl-dark/80 border border-purple-500/20 text-purple-300 font-bold">
                    🏏 Khalnayak XI
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-cpl-dark/80 border border-amber-500/20 text-amber-300 font-bold">
                    🏏 Phurtile Sher
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-cpl-dark/80 border border-cyan-500/20 text-cyan-300 font-bold col-span-2">
                    🏏 Dhurandar XI
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <div className="text-amber-300 font-bold text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Credential Confidentiality</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Each franchise owner can only place bids from their assigned authenticated account. Public visitors can view the live auction without signing in.
                </p>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-500">
                  Testing the application? Click <button type="button" onClick={() => setShowDemoAccounts(true)} className="text-cpl-gold underline font-bold">Show Demo Logins</button> to auto-fill sample credentials.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Click any pre-configured role below to test live bidding, auctioneering, or admin management.
              </p>

              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {demoAccounts.map((demo, idx) => {
                  const isSuper = demo.role === 'superadmin';
                  const isAuct = demo.role === 'auctioneer';
                  const isOwner = demo.role === 'team_owner';

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDemo(demo)}
                      className="w-full p-3 rounded-xl bg-cpl-surface hover:bg-cpl-surface/80 border border-cpl-border/70 hover:border-cpl-gold/50 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs truncate group-hover:text-cpl-gold transition-colors">
                            {demo.name}
                          </span>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                              isSuper
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : isAuct
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}
                          >
                            {demo.teamName ? demo.teamName : demo.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono block mt-0.5 truncate">
                          {demo.email}
                        </span>
                      </div>

                      <span className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-cpl-gold shrink-0">
                        Auto-Fill →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )} 
        </div>

      </div>
    </div>
  );
}
