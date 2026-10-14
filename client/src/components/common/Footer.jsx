import React from 'react';
import { Trophy, ShieldCheck, Zap, Radio } from 'lucide-react';
import { useAuction } from '../../context/AuctionSocketContext';

export default function Footer() {
  const { isConnected, session } = useAuction();

  return (
    <footer className="border-t border-cpl-border bg-cpl-surface/80 mt-20 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-6 h-6 text-cpl-gold" />
              <span className="font-display font-black text-lg text-white tracking-wider">
                MAIDAN KE SULTAN — SEASON 5
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              The premier collegiate cricket tournament live auction system. Real-time synchronized bidding,
              authoritative purse calculations in tournament credits, and official tournament roster management.
            </p>
            <div className="flex items-center gap-3 mt-4 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Audited Transactions</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="w-3.5 h-3.5" />
                <span>Real-Time Bidding</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-3">Tournament Arena</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/live" className="hover:text-cpl-gold transition-colors">Live Scoreboard</a></li>
              <li><a href="/teams" className="hover:text-cpl-gold transition-colors">Franchise Rosters</a></li>
              <li><a href="/players" className="hover:text-cpl-gold transition-colors">Registered Player Pool</a></li>
              <li><a href="/history" className="hover:text-cpl-gold transition-colors">Auction History & Logs</a></li>
            </ul>
          </div>

          {/* Real-time Status */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-3">Auction Network</h4>
            <div className="glass-panel p-3.5 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span>Socket Gateway:</span>
                <span className={`font-bold flex items-center gap-1 ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {isConnected ? 'ONLINE' : 'CONNECTING'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Auction Status:</span>
                <span className="font-bold text-white uppercase">{session?.status || 'IDLE'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Currency:</span>
                <span className="font-bold text-cpl-gold">Credits (CR)</span>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-cpl-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Maidan ke Sultan (Season 5). All tournament rights reserved.</p>
          <p className="mt-2 sm:mt-0">Production-Ready Full-Stack Cricket Auction Engine</p>
        </div>
      </div>
    </footer>
  );
}
