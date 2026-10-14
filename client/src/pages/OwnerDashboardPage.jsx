import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionSocketContext';
import {
  Users,
  DollarSign,
  Trophy,
  Award,
  Search,
  Filter,
  PieChart,
  User,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  KeyRound,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { formatINR, formatINRCompact, formatDateTime } from '../utils/formatters';

export default function OwnerDashboardPage() {
  const { user, assignedTeam } = useAuth();
  const { teams } = useAuction();

  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Password Update Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data?.success) {
        setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordStatus(null);
        }, 1500);
      }
    } catch (err) {
      setPasswordStatus({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to update password.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Find authoritative team from teams list or fetch
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const myTeamId = assignedTeam?._id || user?.assignedTeam?._id;
        if (myTeamId) {
          const res = await api.get(`/teams/${myTeamId}`);
          if (res.data?.success) {
            setTeamData(res.data.team);
          }
        } else if (teams && teams.length > 0) {
          // If superadmin viewing, default to first team
          setTeamData(teams[0]);
        }
      } catch (err) {
        console.error('Failed to load team details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [assignedTeam?._id, user?.assignedTeam?._id, teams]);

  if (!teamData) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-cpl-border text-center space-y-4">
        <Users className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="font-display font-black text-xl text-white">No Assigned Franchise Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Your authenticated account is not currently assigned to a participating team. If you are an administrator, you can assign an owner in the Admin Console.
        </p>
      </div>
    );
  }

  const squad = teamData.squad || [];
  const purchasedCount = teamData.purchasedCount ?? squad.length;
  const maxSlots = teamData.maxSquadSize || 15;
  const remainingSlots = Math.max(0, maxSlots - purchasedCount);
  const initialPurse = teamData.initialPurse || 100;
  const remainingPurse = teamData.remainingPurse ?? (initialPurse - (teamData.committedSpent || 0));
  const spent = teamData.committedSpent || 0;

  const minSquad = 11;
  const minBase = teamData.minBasePrice || 2;
  const slotsNeededForMin = Math.max(0, minSquad - purchasedCount);
  const minReserveNeeded = slotsNeededForMin * minBase;
  const maxSafeBid = teamData.maxSafeBid ?? Math.max(0, remainingPurse - Math.max(0, minSquad - (purchasedCount + 1)) * minBase);
  const deficit = teamData.deficit ?? Math.max(0, minReserveNeeded - remainingPurse);
  const hasDeficit = deficit > 0;

  // Role Breakdown
  const roles = { Batsman: 0, Bowler: 0, 'All-Rounder': 0, 'Wicket-Keeper': 0 };
  let highestPriced = null;
  squad.forEach((item) => {
    const r = item.player?.role;
    if (r && roles[r] !== undefined) roles[r]++;
    if (!highestPriced || item.price > highestPriced.price) {
      highestPriced = item;
    }
  });

  const avgPrice = squad.length > 0 ? Math.round(spent / squad.length) : 0;

  // Filtered Squad
  const filteredSquad = squad.filter((item) => {
    const p = item.player || {};
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.department?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      
      {/* Franchise Banner */}
      <div
        className="glass-panel rounded-3xl p-6 sm:p-8 border border-cpl-border relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${teamData.primaryColor}22 0%, #0D1527 100%)`,
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden bg-cpl-dark border-2 p-1 shrink-0 shadow-lg"
              style={{ borderColor: teamData.primaryColor || '#F59E0B' }}
            >
              {teamData.logoUrl ? (
                <img src={teamData.logoUrl} alt={teamData.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-xl text-white">
                  {teamData.shortCode}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cpl-dark text-cpl-gold border border-cpl-border">
                  {teamData.shortCode}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Official Franchise Portal</span>
              </div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
                {teamData.name}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Team Owner: <strong className="text-white">{user?.name}</strong> ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(true);
                setPasswordStatus(null);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="px-4 py-3 rounded-xl bg-cpl-surface border border-cpl-border hover:border-cpl-gold/50 text-slate-300 hover:text-cpl-gold text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
            >
              <KeyRound className="w-4 h-4 text-cpl-gold" />
              <span>Change Password</span>
            </button>

            <a
              href="/live"
              className="gold-gradient-btn px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-gold flex items-center gap-2"
            >
              <span>Live Auction Floor</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Mathematical Purse Feasibility Warning Banner */}
      {hasDeficit && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-3 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm font-extrabold uppercase tracking-wide text-red-300">
              ⚠️ Mathematical Squad Deficit Warning
            </strong>
            <p className="text-xs text-red-200/90 leading-relaxed">
              Your franchise has a reserve deficit of <strong>{formatINR(deficit)}</strong>. Remaining purse of <strong>{formatINR(remainingPurse)}</strong> is mathematically insufficient to purchase the remaining <strong>{slotsNeededForMin}</strong> player(s) required to fulfill the 11-player minimum squad requirement at the minimum base price of {formatINR(minBase)} each.
            </p>
            <p className="text-[11px] text-red-300/80">
              Future bids should not exceed <strong>{formatINR(maxSafeBid)}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Financial & Squad Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-cpl-border">
          <span className="text-[10px] uppercase font-bold text-slate-400">Available Purse</span>
          <div className="font-display font-black text-2xl text-cpl-gold mt-1">
            {formatINR(remainingPurse)}
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-slate-800">
            <span className="text-slate-500">Initial: {formatINRCompact(initialPurse)}</span>
            <span className="text-emerald-400 font-bold">Max Safe: {formatINRCompact(maxSafeBid)}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cpl-border">
          <span className="text-[10px] uppercase font-bold text-slate-400">Committed Spending</span>
          <div className="font-display font-black text-2xl text-white mt-1">
            {formatINR(spent)}
          </div>
          <span className="text-[10px] text-slate-500">
            {Math.round((spent / initialPurse) * 100)}% budget utilized
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cpl-border">
          <span className="text-[10px] uppercase font-bold text-slate-400">Roster Slots</span>
          <div className="font-display font-black text-2xl text-emerald-400 mt-1">
            {purchasedCount} / {maxSlots}
          </div>
          <span className="text-[10px] text-slate-500">{remainingSlots} vacant spots</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cpl-border">
          <span className="text-[10px] uppercase font-bold text-slate-400">Average Acquisition</span>
          <div className="font-display font-black text-2xl text-slate-200 mt-1">
            {formatINR(avgPrice)}
          </div>
          <span className="text-[10px] text-slate-500">Top buy: {highestPriced ? formatINRCompact(highestPriced.price) : 'N/A'}</span>
        </div>
      </div>

      {/* Role Composition Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-cpl-border">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white mb-4">
          Squad Role Composition
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(roles).map(([role, count]) => (
            <div key={role} className="p-3.5 rounded-xl bg-cpl-surface border border-cpl-border text-center">
              <span className="text-xs text-slate-400 font-bold block">{role}s</span>
              <span className="font-display font-black text-xl text-white mt-1 block">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Drafted Players Table */}
      <div className="glass-panel rounded-2xl border border-cpl-border overflow-hidden">
        <div className="p-6 border-b border-cpl-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-black text-lg text-white">Drafted Squad Roster</h3>
            <p className="text-xs text-slate-400">Authoritative records of players acquired by {teamData.name}.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search squad..."
              className="bg-cpl-surface border border-cpl-border rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-cpl-surface border border-cpl-border rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cpl-gold"
            >
              <option value="all">All Roles</option>
              <option value="Batsman">Batsmen</option>
              <option value="Bowler">Bowlers</option>
              <option value="All-Rounder">All-Rounders</option>
              <option value="Wicket-Keeper">Wicket-Keepers</option>
            </select>
          </div>
        </div>

        {filteredSquad.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            {squad.length === 0 ? 'No players drafted yet in this tournament.' : 'No players match filter criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cpl-surface/80 border-b border-cpl-border text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Acquisition Price</th>
                  <th className="py-3 px-4">Acquired At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cpl-border/50 text-slate-300">
                {filteredSquad.map((item, idx) => {
                  const p = item.player || {};
                  return (
                    <tr key={idx} className="hover:bg-cpl-surface/50">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-cpl-dark flex items-center justify-center text-slate-500">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <span>{p.name}</span>
                      </td>
                      <td className="py-3 px-4">{p.role}</td>
                      <td className="py-3 px-4">{p.department || 'General'}</td>
                      <td className="py-3 px-4 text-slate-400">{p.academicYear || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-400">{formatINR(p.basePrice)}</td>
                      <td className="py-3 px-4 font-display font-extrabold text-sm text-cpl-gold">
                        {formatINR(item.price)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{formatDateTime(item.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-cpl-border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-cpl-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cpl-gold/15 text-cpl-gold border border-cpl-gold/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">
                    Update Account Password
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Change your private franchise owner login password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="w-8 h-8 rounded-lg bg-cpl-surface hover:bg-cpl-border text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordStatus && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  passwordStatus.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/40 text-red-300'
                }`}
              >
                {passwordStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-300 block mb-1">
                  Current Password (Optional if newly provisioned)
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-300 block mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-300 block mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cpl-border">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-cpl-surface hover:bg-cpl-border text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading || !newPassword}
                  className="gold-gradient-btn px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-gold hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{passwordLoading ? 'Saving...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
