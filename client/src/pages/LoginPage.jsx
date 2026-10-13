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
        // Fallback demo accounts
        setDemoAccounts([
          { name: 'Tournament Director', email: 'admin@cpl.edu', role: 'superadmin', defaultPassword: 'Admin@123456' },
          { name: 'Official Auctioneer', email: 'auctioneer@cpl.edu', role: 'auctioneer', defaultPassword: 'Auctioneer@123456' },
          { name: 'Apex Predators Owner', email: 'owner1@cpl.edu', role: 'team_owner', teamName: 'Apex Predators', defaultPassword: 'Owner@123456' },
          { name: 'Titan Strikers Owner', email: 'owner2@cpl.edu', role: 'team_owner', teamName: 'Titan Strikers', defaultPassword: 'Owner@123456' },
          { name: 'Royal Challengers Owner', email: 'owner3@cpl.edu', role: 'team_owner', teamName: 'Royal Challengers Campus', defaultPassword: 'Owner@123456' },
          { name: 'Falcon Blasters Owner', email: 'owner4@cpl.edu', role: 'team_owner', teamName: 'Falcon Blasters', defaultPassword: 'Owner@123456' },
          { name: 'Spartan Knights Owner', email: 'owner5@cpl.edu', role: 'team_owner', teamName: 'Spartan Knights', defaultPassword: 'Owner@123456' },
          { name: 'Viper Warriors Owner', email: 'owner6@cpl.edu', role: 'team_owner', teamName: 'Viper Warriors', defaultPassword: 'Owner@123456' },
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

        {/* Right Column: Demo Accounts Quick Select */}
        <div className="md:col-span-6 glass-panel p-6 rounded-3xl border border-cpl-border space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cpl-gold" />
            <h3 className="font-display font-extrabold text-base text-white">
              Instant Demo Access
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select any pre-configured role below to test live bidding as team owners, auctioneering, or superadmin controls.
          </p>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
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

      </div>
    </div>
  );
}
