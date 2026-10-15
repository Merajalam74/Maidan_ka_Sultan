import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Shield,
  Award,
  CheckCircle,
  Clock,
  XCircle,
  Radio,
  Share2,
  Edit2,
  Phone,
  Building2,
  GraduationCap,
  Sparkles,
  Trophy,
  Activity,
  Flame,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import { formatINR, formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionSocketContext';
import PlayerEditModal from '../components/admin/PlayerEditModal';

export default function PlayerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin, isAuctioneer } = useAuth();
  const { session } = useAuction();

  const [player, setPlayer] = useState(null);
  const [purchase, setPurchase] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchPlayerDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/players/${id}`);
      if (res.data?.success && res.data.player) {
        setPlayer(res.data.player);
        setPurchase(res.data.purchase || null);
        setBids(res.data.bids || []);
      } else {
        setError('Player record not found.');
      }
    } catch (err) {
      console.error('Failed to load player details:', err);
      setError(err.response?.data?.message || err.message || 'Player not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPlayerDetail();
    }
  }, [id, fetchPlayerDetail]);

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.warn('Share copy error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-cpl-gold/20 border-t-cpl-gold animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading player profile details...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4 glass-panel p-8 rounded-3xl border border-cpl-border max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="font-display font-black text-2xl text-white">Player Not Found</h2>
        <p className="text-xs text-slate-400">
          {error || 'The player profile you requested does not exist or has been removed from the tournament registry.'}
        </p>
        <div className="pt-2">
          <Link
            to="/players"
            className="gold-gradient-btn px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Players Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const isSold = player.status === 'sold';
  const isUnsold = player.status === 'unsold';
  const isNominated = player.status === 'nominated';
  const winningTeam = purchase?.winningTeamId || player.winningTeamId;

  // Format stat helper to ignore raw 'nan'
  const cleanStat = (val) => {
    if (val === undefined || val === null || val === 'nan' || val === 'NaN' || val === '') {
      return '—';
    }
    return val;
  };

  const hasStats =
    player.stats &&
    (player.stats.matches !== 'nan' ||
      player.stats.runs !== 'nan' ||
      player.stats.wickets !== 'nan' ||
      player.stats.strikeRate !== 'nan' ||
      player.stats.highestScore !== 'nan');

  const roleColors = {
    'Batsman': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    'Bowler': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    'All-Rounder': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    'Wicket-Keeper': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  };

  const roleBadgeStyle = roleColors[player.role] || 'bg-slate-500/20 text-slate-300 border-slate-500/40';

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      
      {/* Top Navigation & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cpl-border/70">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/players')}
            className="p-2.5 rounded-xl bg-cpl-surface border border-cpl-border hover:border-cpl-gold text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Players</span>
          </button>

          <span className="text-slate-600 hidden sm:inline">•</span>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <Link to="/players" className="hover:text-cpl-gold transition-colors">
              Players
            </Link>
            <span>/</span>
            <span className="text-white font-medium truncate max-w-xs">{player.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Share profile button */}
          <button
            onClick={handleShare}
            className="px-3.5 py-2 rounded-xl bg-cpl-surface border border-cpl-border hover:border-cpl-gold text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold"
            title="Share profile link"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Share Profile</span>
              </>
            )}
          </button>

          {/* Admin Edit button */}
          {(isSuperAdmin || isAuctioneer) && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-2 rounded-xl bg-cpl-gold/15 border border-cpl-gold/40 hover:bg-cpl-gold hover:text-black text-cpl-gold transition-colors flex items-center gap-2 text-xs font-bold"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Dedicated Big Player Portrait & Price Cards */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Big Image Showcase */}
          <div className="glass-panel rounded-3xl border-2 border-cpl-gold/30 p-3 shadow-2xl relative overflow-hidden group">
            {/* Ambient Back Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-cpl-dark via-transparent to-cpl-gold/10 pointer-events-none z-10" />

            <div className="relative w-full h-[440px] sm:h-[500px] md:h-[540px] rounded-2xl overflow-hidden bg-cpl-dark flex items-center justify-center">
              {player.photoUrl ? (
                <img
                  src={player.photoUrl}
                  alt={player.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.name)}`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-cpl-surface to-cpl-dark text-slate-500 p-8 text-center">
                  <div className="w-28 h-28 rounded-full bg-cpl-dark border border-cpl-border flex items-center justify-center mb-4 text-cpl-gold">
                    <User className="w-14 h-14" />
                  </div>
                  <span className="font-display font-extrabold text-lg text-white">{player.name}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">Official Candidate Photo Pending</span>
                </div>
              )}

              {/* Status Ribbon (Top Right) */}
              <div className="absolute top-4 right-4 z-20">
                {isSold ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-black shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>SOLD</span>
                  </span>
                ) : isNominated ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-black shadow-lg flex items-center gap-1.5 animate-pulse backdrop-blur-md">
                    <Radio className="w-3.5 h-3.5" />
                    <span>LIVE LOT</span>
                  </span>
                ) : isUnsold ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/90 text-white shadow-lg backdrop-blur-md">
                    UNSOLD
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cpl-surface/90 text-slate-200 border border-cpl-border backdrop-blur-md">
                    AVAILABLE
                  </span>
                )}
              </div>

              {/* Role Badge (Top Left) */}
              <div className="absolute top-4 left-4 z-20">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border backdrop-blur-md shadow-md ${roleBadgeStyle}`}>
                  {player.role}
                </span>
              </div>

              {/* Bottom Info Badges Overlay */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-cpl-dark/90 text-cpl-gold border border-cpl-gold/40 backdrop-blur-md">
                  {player.category || 'Category A'}
                </span>

                <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-cpl-dark/90 text-slate-300 border border-cpl-border backdrop-blur-md">
                  {player.externalId || 'ID-N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Highlight Card */}
          <div className="glass-panel rounded-2xl border border-cpl-border p-5 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                Official Base Price
              </span>
              <div className="font-display font-black text-2xl text-white">
                {formatINR(player.basePrice)}
              </div>
              <span className="text-[11px] text-slate-500 block">Opening auction floor valuation</span>
            </div>

            <div className="space-y-1 text-right border-l border-cpl-border/80 pl-4">
              <span className="text-[10px] uppercase font-black tracking-wider block text-slate-400">
                {isSold ? 'Final Purchase Price' : 'Acquisition Status'}
              </span>
              <div className={`font-display font-black text-2xl ${isSold ? 'text-cpl-gold' : 'text-slate-300'}`}>
                {isSold ? formatINR(player.soldPrice) : player.status?.toUpperCase()}
              </div>
              <span className="text-[11px] text-slate-500 block">
                {isSold ? 'Closed under auction gavel' : 'Registered candidate pool'}
              </span>
            </div>
          </div>

          {/* Live Auction Floor Callout (if active lot) */}
          {isNominated && (
            <div className="glass-panel rounded-2xl border border-amber-500/40 p-5 bg-gradient-to-r from-amber-500/10 via-cpl-surface to-transparent shadow-gold">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
                <div>
                  <h4 className="font-display font-black text-sm text-white">
                    THIS PLAYER IS ON THE LIVE AUCTION BLOCK!
                  </h4>
                  <p className="text-xs text-amber-300/80 mt-0.5">
                    Live bidding is currently underway. View or place bids now.
                  </p>
                </div>
              </div>
              <Link
                to="/live"
                className="mt-4 gold-gradient-btn w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4 text-black" />
                <span>Enter Live Auction Arena</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

        </div>

        {/* Right Column: Detailed Biography, Playing Attributes, Franchise Assignment & Stats */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Title & Style Header */}
          <div className="glass-panel rounded-3xl border border-cpl-border p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${roleBadgeStyle}`}>
                {player.role}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-cpl-surface border border-cpl-border text-slate-300">
                {player.category || 'Category A'}
              </span>
              {player.externalId && (
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-cpl-surface border border-cpl-border text-slate-400">
                  ID: {player.externalId}
                </span>
              )}
            </div>

            <div>
              <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                {player.name}
              </h1>
              <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
                <span>{player.department}</span>
                <span>•</span>
                <span>{player.academicYear}</span>
              </p>
            </div>

            {/* Cricket Styles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-cpl-border/80">
              <div className="p-3.5 rounded-xl bg-cpl-surface/70 border border-cpl-border/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Batting Style
                </span>
                <span className="font-semibold text-white text-sm mt-0.5 block">
                  {player.battingStyle || 'Right-hand bat'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-cpl-surface/70 border border-cpl-border/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Bowling Style
                </span>
                <span className="font-semibold text-white text-sm mt-0.5 block">
                  {player.bowlingStyle || 'Right-arm medium'}
                </span>
              </div>
            </div>
          </div>

          {/* Franchise Acquisition Card (if Sold) */}
          {isSold && winningTeam && (
            <div
              className="glass-panel rounded-3xl border-2 p-6 sm:p-7 relative overflow-hidden shadow-2xl"
              style={{ borderColor: winningTeam.primaryColor || '#F59E0B' }}
            >
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: winningTeam.primaryColor || '#F59E0B' }}
              />

              <div className="flex items-center justify-between pb-4 border-b border-cpl-border/80">
                <span className="text-xs font-black uppercase tracking-widest text-cpl-gold flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-cpl-gold" />
                  <span>DRAFTED FRANCHISE</span>
                </span>
                <Link
                  to="/teams"
                  className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <span>View All Rosters</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl overflow-hidden bg-cpl-dark border-2 p-0.5 shrink-0 shadow-lg flex items-center justify-center"
                    style={{ borderColor: winningTeam.primaryColor || '#F59E0B' }}
                  >
                    {winningTeam.logoUrl ? (
                      <img
                        src={winningTeam.logoUrl}
                        alt={winningTeam.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="font-display font-black text-xl text-cpl-gold">
                        {winningTeam.shortCode}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display font-black text-xl text-white">
                      {winningTeam.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Code: <span className="font-mono font-bold text-white">{winningTeam.shortCode}</span>
                      {winningTeam.captainName && ` • Captain: ${winningTeam.captainName}`}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right bg-cpl-surface/90 px-4 py-3 rounded-2xl border border-cpl-border shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                    Winning Bid
                  </span>
                  <div className="font-display font-black text-2xl text-cpl-gold">
                    {formatINR(player.soldPrice || purchase?.finalPurchasePrice)}
                  </div>
                  {purchase?.settledAt && (
                    <span className="text-[10px] text-slate-500 block">
                      Settled at {formatDateTime(purchase.settledAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Academic & Contact Details */}
          <div className="glass-panel rounded-3xl border border-cpl-border p-6 space-y-4">
            <h3 className="font-display font-black text-base text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cpl-gold" />
              <span>Collegiate Registration & Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-cpl-surface/80 border border-cpl-border">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-cpl-gold" />
                  <span className="font-bold uppercase text-[10px]">Department</span>
                </div>
                <span className="font-bold text-white text-sm block">
                  {player.department || 'General'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-cpl-surface/80 border border-cpl-border">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-cpl-gold" />
                  <span className="font-bold uppercase text-[10px]">Academic Year</span>
                </div>
                <span className="font-bold text-white text-sm block">
                  {player.academicYear || 'N/A'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-cpl-surface/80 border border-cpl-border">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Phone className="w-3.5 h-3.5 text-cpl-gold" />
                  <span className="font-bold uppercase text-[10px]">Phone Number</span>
                </div>
                <span className="font-mono font-bold text-white text-sm block truncate">
                  {player.phoneNumber ? (
                    <a
                      href={`tel:${player.phoneNumber}`}
                      className="hover:text-cpl-gold transition-colors"
                    >
                      {player.phoneNumber}
                    </a>
                  ) : (
                    'Not Provided'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Cricket Statistics (CricHeroes / Tournament History) */}
          <div className="glass-panel rounded-3xl border border-cpl-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cpl-gold" />
                <span>Cricket Track Record & Match Statistics</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono uppercase">
                Verified Match Pool
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-cpl-surface/70 border border-cpl-border text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Matches
                </span>
                <span className="font-display font-black text-xl text-white mt-0.5 block">
                  {cleanStat(player.stats?.matches)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cpl-surface/70 border border-cpl-border text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Total Runs
                </span>
                <span className="font-display font-black text-xl text-white mt-0.5 block">
                  {cleanStat(player.stats?.runs)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cpl-surface/70 border border-cpl-border text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Wickets
                </span>
                <span className="font-display font-black text-xl text-white mt-0.5 block">
                  {cleanStat(player.stats?.wickets)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cpl-surface/70 border border-cpl-border text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Strike Rate
                </span>
                <span className="font-display font-black text-xl text-cpl-gold mt-0.5 block">
                  {cleanStat(player.stats?.strikeRate)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cpl-surface/70 border border-cpl-border text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Economy
                </span>
                <span className="font-display font-black text-xl text-white mt-0.5 block">
                  {cleanStat(player.stats?.economy)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cpl-surface/70 border border-cpl-border text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Highest Score
                </span>
                <span className="font-display font-black text-xl text-white mt-0.5 block">
                  {cleanStat(player.stats?.highestScore)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-cpl-surface/70 border border-cpl-border text-center col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Best Bowling Figures
                </span>
                <span className="font-display font-black text-xl text-emerald-400 mt-0.5 block">
                  {cleanStat(player.stats?.bestBowling)}
                </span>
              </div>
            </div>

            {/* Notes / Scout Bio */}
            {player.notes && (
              <div className="mt-4 p-4 rounded-xl bg-cpl-surface/50 border border-cpl-border text-xs text-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Scout & Management Notes
                </span>
                <p className="italic leading-relaxed">{player.notes}</p>
              </div>
            )}
          </div>

          {/* Auction Bidding Trail (if bids occurred for this player) */}
          {bids.length > 0 && (
            <div className="glass-panel rounded-3xl border border-cpl-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cpl-gold" />
                  <span>Auction Bidding History ({bids.length} bids)</span>
                </h3>
                <span className="text-[10px] text-slate-500 uppercase font-mono">
                  Live Audit Trail
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {bids.map((b, index) => {
                  const team = b.teamId || {};
                  return (
                    <div
                      key={b._id || index}
                      className="p-3 rounded-xl bg-cpl-surface/80 border border-cpl-border/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg overflow-hidden bg-cpl-dark border flex items-center justify-center font-bold text-[10px]"
                          style={{ borderColor: team.primaryColor || '#F59E0B' }}
                        >
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            team.shortCode || 'TM'
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white block">
                            {team.name || 'Participating Franchise'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatDateTime(b.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-display font-black text-cpl-gold text-sm block">
                          {formatINR(b.bidAmount)}
                        </span>
                        {index === 0 && (
                          <span className="text-[9px] font-bold uppercase text-emerald-400 block">
                            High Bid
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Admin Quick Edit Modal */}
      <PlayerEditModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        player={player}
        onSaved={() => {
          fetchPlayerDetail();
          setIsEditing(false);
        }}
      />

    </div>
  );
}
