import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Radio, Shield, Users, UserCheck, Volume2, VolumeX, LogIn, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import { useAuction } from '../../context/AuctionSocketContext';

export default function Navbar() {
  const location = useLocation();
  const { user, isAuctioneer, isTeamOwner, logout, assignedTeam } = useAuth();
  const { enabled: soundOn, toggleSound } = useSound();
  const { session, isConnected } = useAuction();

  const isLive = session?.status === 'active';
  const isPaused = session?.status === 'paused';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Live Auction', path: '/live', highlight: true },
    { name: 'Franchises', path: '/teams' },
    { name: 'Players Pool', path: '/players' },
    { name: 'Auction History', path: '/history' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-cpl-dark/90 backdrop-blur-md border-b border-cpl-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cpl-gold to-cpl-gold-dark p-0.5 shadow-gold">
              <div className="w-full h-full bg-cpl-dark rounded-[10px] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-cpl-gold group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl tracking-wider text-white">
                  MAIDAN KE SULTAN
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cpl-gold/15 text-cpl-gold border border-cpl-gold/30">
                  SEASON 5
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Official 5-Team Cricket Live Player Auction Platform</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    active
                      ? 'text-cpl-gold bg-cpl-gold/10 border border-cpl-gold/20 shadow-sm'
                      : link.highlight
                      ? 'text-white hover:text-cpl-gold hover:bg-cpl-surface'
                      : 'text-slate-300 hover:text-white hover:bg-cpl-surface/80'
                  }`}
                >
                  {link.highlight && (
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isLive ? 'bg-emerald-400' : isPaused ? 'bg-amber-400' : 'bg-slate-400'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          isLive ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-slate-500'
                        }`}
                      />
                    </span>
                  )}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Sound, Role Quicklinks, User Auth */}
          <div className="flex items-center gap-3">
            
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={soundOn ? 'Sound alerts enabled' : 'Sound alerts muted'}
              className="p-2.5 rounded-lg bg-cpl-surface border border-cpl-border text-slate-300 hover:text-cpl-gold hover:border-cpl-gold/40 transition-colors"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-cpl-gold" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Role Dedicated Portals */}
            {isTeamOwner && (
              <Link
                to="/owner/dashboard"
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>My Team</span>
                {assignedTeam && <span className="text-white">({assignedTeam.shortCode})</span>}
              </Link>
            )}

            {isAuctioneer && (
              <Link
                to="/admin"
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cpl-surface border border-cpl-border">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cpl-gold to-amber-600 flex items-center justify-center text-xs font-bold text-black uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">{user.name}</p>
                    <p className="text-[10px] font-semibold text-cpl-gold uppercase tracking-wider">{user.globalRole}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-2 rounded-lg bg-cpl-surface hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-cpl-border transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="gold-gradient-btn px-4 py-2 rounded-lg text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
