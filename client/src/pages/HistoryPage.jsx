import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Printer,
  TrendingUp,
  Award,
  DollarSign,
  Users,
  Trophy,
} from 'lucide-react';
import api from '../services/api';
import { formatINR, formatINRCompact, formatDateTime } from '../utils/formatters';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchases, setPurchases] = useState([]);
  const [bids, setBids] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sumRes, purchRes, bidsRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/purchases'),
          api.get('/reports/bids?limit=100'),
        ]);
        if (sumRes.data?.success) setSummary(sumRes.data.summary);
        if (purchRes.data?.success) setPurchases(purchRes.data.purchases || []);
        if (bidsRes.data?.success) setBids(bidsRes.data.bids || []);
      } catch (err) {
        console.error('Failed to load history data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownloadCsv = () => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export-csv`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cpl-border">
        <div>
          <h1 className="font-display font-black text-3xl text-white">
            AUCTION AUDIT LOG & ANALYTICS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official chronological records of all accepted bids, transactions, and final expenditures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl bg-cpl-surface border border-cpl-border hover:border-cpl-gold text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-cpl-gold" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-cpl-surface border border-cpl-border hover:border-cpl-gold text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-cpl-border">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Spend</span>
          <div className="font-display font-black text-2xl text-cpl-gold mt-1">
            {formatINR(summary?.totalExpenditure || 0)}
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-cpl-border">
          <span className="text-[10px] uppercase font-bold text-slate-400">Sold Players</span>
          <div className="font-display font-black text-2xl text-emerald-400 mt-1">
            {summary?.soldPlayers || 0}
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-cpl-border">
          <span className="text-[10px] uppercase font-bold text-slate-400">Average Purchase</span>
          <div className="font-display font-black text-2xl text-white mt-1">
            {formatINR(summary?.averagePrice || 0)}
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-cpl-border">
          <span className="text-[10px] uppercase font-bold text-slate-400">Highest Purchase</span>
          <div className="font-display font-black text-2xl text-amber-400 mt-1 truncate">
            {summary?.highestPurchase ? formatINR(summary.highestPurchase.price) : '₹0'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cpl-border gap-4">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'purchases'
              ? 'border-cpl-gold text-cpl-gold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Completed Purchases ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('bids')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'bids'
              ? 'border-cpl-gold text-cpl-gold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          All Accepted Bids ({bids.length})
        </button>
      </div>

      {/* Tab 1: Completed Purchases */}
      {activeTab === 'purchases' && (
        <div className="glass-panel rounded-2xl border border-cpl-border overflow-hidden">
          {purchases.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No completed purchases recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cpl-surface/80 border-b border-cpl-border text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Player</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Base Price</th>
                    <th className="py-3.5 px-4">Winning Team</th>
                    <th className="py-3.5 px-4">Final Price</th>
                    <th className="py-3.5 px-4">Sold At</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cpl-border/50 text-slate-300">
                  {purchases.map((p) => {
                    const player = p.playerId || {};
                    const team = p.winningTeamId || {};
                    const isReversed = p.status === 'reversed';

                    return (
                      <tr key={p._id} className={isReversed ? 'opacity-50 bg-red-950/20' : 'hover:bg-cpl-surface/50'}>
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          {player.photoUrl && (
                            <img src={player.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                          )}
                          <span>{player.name || 'Unknown'}</span>
                        </td>
                        <td className="py-3 px-4">{player.role}</td>
                        <td className="py-3 px-4">{player.department}</td>
                        <td className="py-3 px-4">{formatINR(player.basePrice)}</td>
                        <td className="py-3 px-4 font-bold text-cpl-gold">{team.name}</td>
                        <td className="py-3 px-4 font-display font-extrabold text-sm text-white">
                          {formatINR(p.finalPurchasePrice)}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{formatDateTime(p.settledAt)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isReversed
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Chronological Bids */}
      {activeTab === 'bids' && (
        <div className="glass-panel rounded-2xl border border-cpl-border overflow-hidden">
          {bids.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No accepted bids recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cpl-surface/80 border-b border-cpl-border text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Time</th>
                    <th className="py-3.5 px-4">Player</th>
                    <th className="py-3.5 px-4">Team</th>
                    <th className="py-3.5 px-4">Bidder</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cpl-border/50 text-slate-300">
                  {bids.map((b) => (
                    <tr key={b._id} className="hover:bg-cpl-surface/50">
                      <td className="py-3 px-4 text-slate-400">{formatDateTime(b.timestamp)}</td>
                      <td className="py-3 px-4 font-bold text-white">{b.playerId?.name || 'Lot'}</td>
                      <td className="py-3 px-4 font-bold text-cpl-gold">{b.teamId?.name || 'Team'}</td>
                      <td className="py-3 px-4 text-slate-400">{b.bidderId?.name || 'Owner'}</td>
                      <td className="py-3 px-4 font-display font-extrabold text-sm text-right text-white">
                        {formatINR(b.bidAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
