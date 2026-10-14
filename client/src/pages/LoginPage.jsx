import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, LogIn, Key, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect based on role
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Navigation handled by useEffect
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl border border-cpl-border shadow-2xl space-y-6">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cpl-gold to-cpl-gold-dark p-0.5 mx-auto shadow-gold">
            <div className="w-full h-full bg-cpl-dark rounded-[14px] flex items-center justify-center">
              <Trophy className="w-8 h-8 text-cpl-gold" />
            </div>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
            Authorized Sign In
          </h2>
          <p className="text-xs text-slate-400">
            Sign in with your registered tournament or franchise credentials.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@mks.edu"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold transition-colors"
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
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gold-gradient-btn py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-gold transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In To Account'}</span>
          </button>
        </form>

        {/* Footer Note */}
        <div className="pt-2 text-center border-t border-cpl-border/60">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-600" />
            <span>Public visitors can view the live auction without signing in.</span>
          </p>
        </div>

      </div>
    </div>
  );
}
