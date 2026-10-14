import React from 'react';
import { Trophy, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleFormCsvBuilder from '../components/admin/GoogleFormCsvBuilder';

export default function RegisterPlayerPage() {
  const { user, isAuctioneer, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Verifying administrative authorization...
      </div>
    );
  }

  if (!user || (!isSuperAdmin && !isAuctioneer)) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cpl-border">
        <div>
          <Link
            to="/"
            className="text-xs font-bold text-slate-400 hover:text-cpl-gold flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tournament Home</span>
          </Link>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
            PLAYER NOMINATION & REGISTRATION PORTAL
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maidan ke Sultan — Season 5 Official Player Enrollment.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-cpl-gold/15 border border-cpl-gold/30 text-cpl-gold font-mono text-xs font-bold flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          <span>5 Franchises • 100 Credits Purse</span>
        </div>
      </div>

      {/* Main Builder & Registration Kit */}
      <GoogleFormCsvBuilder />
    </div>
  );
}
