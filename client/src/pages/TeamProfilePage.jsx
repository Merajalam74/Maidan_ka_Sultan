import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Crown,
  Users,
  DollarSign,
  Shield,
  Award,
  Sparkles,
  Share2,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  User,
  Medal,
  Calendar,
  Flame,
} from 'lucide-react';
import api from '../services/api';
import { formatINR, formatINRCompact, formatDateTime } from '../utils/formatters';
import { getTeamHistoryData } from '../utils/teamHistory';
import { useAuction } from '../context/AuctionSocketContext';

export default function TeamProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { teams: allContextTeams } = useAuction();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/teams/${id}`);
      if (res.data?.success && res.data.team) {
        setTeam(res.data.team);
      } else {
        // Fallback to auction context if API single team fails
        const fallback = allContextTeams?.find((t) => t._id === id);
        if (fallback) setTeam(fallback);
        else setError('Team not found');
      }
    } catch (err) {
      console.warn('Failed to load team by ID, checking context fallback:', err);
      const fallback = allContextTeams?.find((t) => t._id === id);
      if (fallback) {
        setTeam(fallback);
      } else {
        setError(err.response?.data?.message || err.message || 'Team record not found.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, allContextTeams]);

  useEffect(() => {
    if (id) {
      fetchTeam();
    }
  }, [id, fetchTeam]);

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.warn('Clipboard share error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-cpl-gold/20 border-t-cpl-gold animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading franchise profile and roster records...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4 glass-panel p-8 rounded-3xl border border-cpl-border max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="font-display font-black text-2xl text-white">Franchise Not Found</h2>
        <p className="text-xs text-slate-400">
          {error || 'The franchise record you requested does not exist or has been removed from this tournament.'}
        </p>
        <div className="pt-2">
          <Link
            to="/teams"
            className="gold-gradient-btn px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to All Franchises</span>
          </Link>
        </div>
      </div>
    );
  }

  const history = getTeamHistoryData(team.name) || {};
  const squad = team.squad || [];
  const purchasedCount = team.purchasedCount ?? squad.length;
  const maxSlots = team.maxSquadSize || 15;
  const minSquad = 11;
  const remainingPurse = team.remainingPurse ?? team.initialPurse ?? 100;
  const committedSpent = team.committedSpent ?? 0;
  const safeBid = team.maxSafeBid ?? Math.max(0, remainingPurse - Math.max(0, minSquad - (purchasedCount + 1)));

  const description = history.description || team.description || 'Official competing franchise of Maidan ke Sultan.';
  const achievements = (history.achievements && history.achievements.length > 0) ? history.achievements : (team.achievements || []);
  const championshipTitles = (history.championshipTitles !== undefined) ? history.championshipTitles : (team.championshipTitles || []);
  const trophyCount = history.trophyCount ?? championshipTitles.length;
  const yearsWon = history.yearsWon || [];
  const motto = history.motto || team.motto || '';

  const captainPlayer = team.captainPlayer;
  const captainPhotoUrl =
    team.captainPhotoUrl ||
    captainPlayer?.photoUrl ||
    team.ownerUserId?.avatar ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(team.captainName || team.name)}`;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      
      {/* Top Navigation & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cpl-border/70">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teams')}
            className="p-2.5 rounded-xl bg-cpl-surface border border-cpl-border hover:border-cpl-gold text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Franchises</span>
          </button>

          <span className="text-slate-600 hidden sm:inline">•</span>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <Link to="/teams" className="hover:text-cpl-gold transition-colors">
              Franchises
            </Link>
            <span>/</span>
            <span className="text-white font-medium truncate max-w-xs">{team.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleShare}
            className="px-3.5 py-2 rounded-xl bg-cpl-surface border border-cpl-border hover:border-cpl-gold text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold"
            title="Share team profile link"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Share Franchise</span>
              </>
            )}
          </button>

          <Link
            to="/live"
            className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <span>Live Arena</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Hero Franchise Showcase Banner */}
      <div
        className="glass-panel rounded-3xl border-2 p-6 sm:p-10 relative overflow-hidden shadow-2xl"
        style={{
          borderColor: team.primaryColor || '#F59E0B',
          background: `linear-gradient(135deg, ${team.primaryColor || '#F59E0B'}18 0%, rgba(13, 21, 39, 0.85) 60%, #070B14 100%)`,
        }}
      >
        {/* Glow Spheres */}
        <div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: team.primaryColor || '#F59E0B' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: team.secondaryColor || '#3B82F6' }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Logo & Trophy Ribbons */}
          <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="relative group">
              <div
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden bg-cpl-dark border-3 p-1.5 shadow-2xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500"
                style={{ borderColor: team.primaryColor || '#F59E0B' }}
              >
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <span className="font-display font-black text-4xl text-cpl-gold">
                    {team.shortCode}
                  </span>
                )}
              </div>

              {/* Trophies Overlay Count */}
              {trophyCount > 0 && (
                <div className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-black px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1 border border-amber-200">
                  <Trophy className="w-3.5 h-3.5 fill-black" />
                  <span>{trophyCount}x Champion</span>
                </div>
              )}
            </div>

            {/* Short Code & Motto */}
            <div className="mt-4 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-black uppercase tracking-widest bg-cpl-dark/90 text-cpl-gold border border-cpl-gold/40">
                CODE: {team.shortCode}
              </span>
              {motto && (
                <span className="text-xs italic text-slate-300 font-medium">
                  "{motto}"
                </span>
              )}
            </div>
          </div>

          {/* Franchise Title, Achievements & Lore */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Title Badge / Championship Highlights */}
            <div className="flex flex-wrap items-center gap-2">
              {yearsWon.length > 0 ? (
                yearsWon.map((year, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400/20 to-amber-600/30 text-amber-300 border border-amber-400/50 shadow-md flex items-center gap-1.5"
                  >
                    <Trophy className="w-3.5 h-3.5 text-cpl-gold" />
                    <span>{year} Champions</span>
                  </span>
                ))
              ) : history.titleBadge ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-cpl-gold" />
                  <span>{history.titleBadge}</span>
                </span>
              ) : championshipTitles.length > 0 ? (
                championshipTitles.map((title, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cpl-surface border border-cpl-border text-slate-300 flex items-center gap-1.5"
                  >
                    <Medal className="w-3.5 h-3.5 text-cpl-gold" />
                    <span>{title}</span>
                  </span>
                ))
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cpl-surface border border-cpl-border text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-cpl-gold" />
                  <span>Championship Contender</span>
                </span>
              )}

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cpl-dark/80 border border-cpl-border text-slate-300">
                Official Season 5 Franchise
              </span>
            </div>

            {/* Franchise Name */}
            <div>
              <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-none">
                {team.name}
              </h1>
            </div>

            {/* Lore Description */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
              {description}
            </p>

            {/* Key Achievements Bullets */}
            {achievements.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-cpl-gold block mb-2">
                  Key Honors & Records
                </span>
                <div className="flex flex-wrap gap-2">
                  {achievements.map((ach, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-cpl-surface/80 border border-cpl-border/80 text-xs text-slate-200 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cpl-gold shrink-0" />
                      <span>{ach}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Leadership & Financial Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Captain Showcase & Owner Card */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dedicated Captain Card with Matched Player Photo */}
          <div className="glass-panel rounded-3xl border border-cpl-border p-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-cpl-border/70">
              <span className="text-xs font-black uppercase tracking-wider text-cpl-gold flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-cpl-gold" />
                <span>TEAM CAPTAIN & LEADER</span>
              </span>
              {captainPlayer && (
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Verified Candidate
                </span>
              )}
            </div>

            <div className="mt-5 flex items-center gap-5">
              {/* Captain Photo */}
              <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-cpl-dark border-2 border-cpl-gold/50 shadow-stadium shrink-0">
                <img
                  src={captainPhotoUrl}
                  alt={team.captainName || 'Team Captain'}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(team.captainName || team.name)}`;
                  }}
                />
                <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-cpl-dark/85 backdrop-blur-md text-cpl-gold border border-cpl-gold/30">
                  <Crown className="w-3 h-3 text-cpl-gold" />
                </div>
              </div>

              {/* Captain Details */}
              <div className="min-w-0 space-y-1">
                <h3 className="font-display font-black text-xl text-white truncate">
                  {team.captainName || 'Captain TBA'}
                </h3>
                
                {captainPlayer ? (
                  <>
                    <p className="text-xs font-bold text-cpl-gold">
                      {captainPlayer.role}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {captainPlayer.department} • {captainPlayer.academicYear}
                    </p>
                    <div className="pt-2">
                      <Link
                        to={`/players/${captainPlayer._id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-cpl-gold hover:underline font-bold"
                      >
                        <span>View Captain Player Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">
                    Official on-field franchise captain and marquee leader.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Franchise Owner & Management Card */}
          <div className="glass-panel rounded-3xl border border-cpl-border p-6 space-y-4">
            <h4 className="font-display font-black text-sm text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cpl-gold" />
              <span>Franchise Ownership & Management</span>
            </h4>

            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-cpl-surface/80 border border-cpl-border">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-cpl-dark border border-cpl-border flex items-center justify-center shrink-0">
                {team.ownerUserId?.avatar ? (
                  <img
                    src={team.ownerUserId.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-slate-500" />
                )}
              </div>

              <div className="min-w-0">
                <h5 className="font-bold text-sm text-white truncate">
                  {team.ownerUserId?.name || 'Assigned Franchise Owner'}
                </h5>
                <p className="text-xs text-slate-400 font-mono truncate">
                  {team.ownerUserId?.email || 'owner@mks.edu'}
                </p>
                <span className="text-[10px] text-cpl-gold uppercase font-bold block mt-0.5">
                  Authorized Auction Gavel Representative
                </span>
              </div>
            </div>
          </div>

          {/* Quick Browse Other Franchises */}
          <div className="glass-panel rounded-3xl border border-cpl-border p-6 space-y-3">
            <h4 className="font-display font-black text-sm text-white">
              Explore All 6 Franchises
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(allContextTeams || []).map((t) => (
                <Link
                  key={t._id}
                  to={`/teams/${t._id}`}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    t._id === team._id
                      ? 'bg-cpl-surface border-cpl-gold text-white font-bold'
                      : 'bg-cpl-surface/50 border-cpl-border hover:border-cpl-gold/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: t.primaryColor || '#F59E0B' }}
                  />
                  <span className="truncate">{t.name}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Financial Purse Desk & Complete Drafted Squad */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Purse & Squad Capacity Dashboard */}
          <div className="glass-panel rounded-3xl border border-cpl-border p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-cpl-border/70">
              <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cpl-gold" />
                <span>Authoritative Purse & Financial Status</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-400">
                100 Credits Cap
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-cpl-surface/80 border border-cpl-border">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Remaining Purse
                </span>
                <span className="font-display font-black text-xl text-cpl-gold block mt-0.5">
                  {formatINR(remainingPurse)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-cpl-surface/80 border border-cpl-border">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Spent Purse
                </span>
                <span className="font-display font-black text-xl text-white block mt-0.5">
                  {formatINR(committedSpent)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-cpl-surface/80 border border-cpl-border">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Drafted Roster
                </span>
                <span className="font-display font-black text-xl text-white block mt-0.5">
                  {purchasedCount} / {maxSlots}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-cpl-surface/80 border border-cpl-border">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Max Safe Bid
                </span>
                <span className="font-display font-black text-xl text-emerald-400 block mt-0.5">
                  {formatINR(safeBid)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Purse Consumption</span>
                <span className="font-bold text-white">
                  {(((team.initialPurse || 100) - remainingPurse) / (team.initialPurse || 100) * 100).toFixed(0)}% Utilized
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-cpl-gold h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(5, ((remainingPurse / (team.initialPurse || 100)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Drafted Squad Showcase */}
          <div className="glass-panel rounded-3xl border border-cpl-border p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cpl-border/70">
              <div>
                <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cpl-gold" />
                  <span>Official Drafted Roster ({squad.length} Players)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any player card to inspect their dedicated player profile page.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-cpl-gold bg-cpl-surface px-2.5 py-1 rounded-lg border border-cpl-border">
                Min 11 • Max 15
              </span>
            </div>

            {squad.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm glass-panel rounded-2xl border border-cpl-border/50">
                <p className="text-white font-bold mb-1">No players drafted yet</p>
                <p className="text-xs text-slate-400">
                  {team.name} will begin building their Season 5 roster during the live auction floor rounds.
                </p>
                <div className="pt-4">
                  <Link
                    to="/live"
                    className="gold-gradient-btn px-5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>Enter Live Auction Arena</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {squad.map((item, idx) => {
                  const player = item.player || {};
                  return (
                    <Link
                      key={item.purchaseId || idx}
                      to={player._id ? `/players/${player._id}` : '#'}
                      className="p-3.5 rounded-2xl bg-cpl-surface/80 border border-cpl-border/80 hover:border-cpl-gold/60 flex items-center justify-between gap-3 group transition-all cursor-pointer shadow-md"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-cpl-dark border border-cpl-border group-hover:border-cpl-gold/50 shrink-0 transition-colors">
                          {player.photoUrl ? (
                            <img
                              src={player.photoUrl}
                              alt={player.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.name)}`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className="truncate">
                          <h4 className="font-bold text-sm text-white group-hover:text-cpl-gold transition-colors truncate flex items-center gap-1">
                            <span className="truncate">{player.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cpl-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {player.role} • {player.department || 'General'}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Base: {formatINR(player.basePrice)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                          Sold Price
                        </span>
                        <span className="font-display font-black text-cpl-gold text-base block">
                          {formatINR(item.price)}
                        </span>
                        {item.timestamp && (
                          <span className="text-[9px] text-slate-500 font-mono block">
                            {formatDateTime(item.timestamp)}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
