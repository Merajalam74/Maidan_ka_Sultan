import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { getSocket } from '../socket/socket';
import api from '../services/api';
import { useSound } from './SoundContext';
import { useAuth } from './AuthContext';

const AuctionSocketContext = createContext(null);

export function AuctionSocketProvider({ children }) {
  const { playBidChime, playGavelStrike, playSoldFanfare, playTimerTick, playErrorBuzzer } = useSound();
  const { user, assignedTeam } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [session, setSession] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [teams, setTeams] = useState([]);
  const [recentBids, setRecentBids] = useState([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bidError, setBidError] = useState(null);
  const [soldCelebration, setSoldCelebration] = useState(null);

  // Fetch initial state via REST
  const fetchLiveState = useCallback(async () => {
    try {
      const res = await api.get('/auction/state');
      if (res.data?.success) {
        setTournament(res.data.tournament);
        setSession(res.data.session);
        setCurrentPlayer(res.data.currentPlayer);
        setTeams(res.data.teams || []);
        setRecentBids(res.data.recentBids || []);
        setRemainingSeconds(res.data.session?.remainingSeconds || 0);
      }
    } catch (err) {
      console.warn('Could not fetch auction state:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveState();
  }, [fetchLiveState]);

  // Socket setup
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      if (tournament?.id) {
        socket.emit('auction:join', {
          tournamentId: tournament.id,
          teamId: assignedTeam?._id,
        });
      }
    };

    const onDisconnect = () => setIsConnected(false);

    const onAuctionState = (data) => {
      if (data.session) {
        setSession(data.session);
        setCurrentPlayer(data.session.currentPlayerId || null);
        if (data.session.remainingSeconds !== undefined) {
          setRemainingSeconds(data.session.remainingSeconds);
        }
      }
      if (data.teams) {
        setTeams(data.teams);
      }
    };

    const onBidAccepted = (data) => {
      playBidChime();
      setBidError(null);
      if (data.session) {
        setSession(data.session);
      }
      if (data.teams) {
        setTeams(data.teams);
      }
      if (data.bid) {
        setRecentBids((prev) => [data.bid, ...prev.slice(0, 19)]);
      }
    };

    const onBidRejected = (data) => {
      playErrorBuzzer();
      setBidError(data.message || 'Bid submission was rejected.');
    };

    const onTimerUpdated = (data) => {
      if (data.remainingSeconds !== undefined) {
        setRemainingSeconds(data.remainingSeconds);
        if (data.remainingSeconds > 0 && data.remainingSeconds <= 5) {
          playTimerTick(true);
        }
      }
    };

    const onPlayerSold = (data) => {
      playGavelStrike();
      playSoldFanfare();

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#FBBF24', '#FFFFFF'],
        });
      } catch (e) {
        // Ignore in headless/SSR
      }

      setSoldCelebration({
        player: data.result?.player,
        team: data.result?.team,
        price: data.result?.purchase?.finalPurchasePrice,
      });

      if (data.teams) setTeams(data.teams);
      fetchLiveState();

      // Clear celebration after 6 seconds
      setTimeout(() => setSoldCelebration(null), 6000);
    };

    const onPlayerUnsold = (data) => {
      playGavelStrike();
      setSoldCelebration({
        player: data.result?.player,
        isUnsold: true,
      });
      fetchLiveState();
      setTimeout(() => setSoldCelebration(null), 4000);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('auction:state', onAuctionState);
    socket.on('bid:accepted', onBidAccepted);
    socket.on('bid:rejected', onBidRejected);
    socket.on('auction:timer-updated', onTimerUpdated);
    socket.on('auction:player-sold', onPlayerSold);
    socket.on('auction:player-unsold', onPlayerUnsold);

    if (socket.connected && tournament?.id) {
      socket.emit('auction:join', {
        tournamentId: tournament.id,
        teamId: assignedTeam?._id,
      });
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('auction:state', onAuctionState);
      socket.off('bid:accepted', onBidAccepted);
      socket.off('bid:rejected', onBidRejected);
      socket.off('auction:timer-updated', onTimerUpdated);
      socket.off('auction:player-sold', onPlayerSold);
      socket.off('auction:player-unsold', onPlayerUnsold);
    };
  }, [
    tournament?.id,
    assignedTeam?._id,
    fetchLiveState,
    playBidChime,
    playGavelStrike,
    playSoldFanfare,
    playTimerTick,
    playErrorBuzzer,
  ]);

  // Actions
  const placeBid = async (amount) => {
    setBidError(null);
    if (!tournament?.id) return;
    const teamId = assignedTeam?._id || user?.assignedTeam?._id;
    if (!teamId && user?.globalRole !== 'superadmin') {
      setBidError('No assigned team found for your account.');
      return;
    }

    try {
      const res = await api.post('/auction/bid', {
        tournamentId: tournament.id,
        teamId: teamId || teams[0]?._id,
        bidAmount: amount,
        idempotencyKey: `bid_${Date.now()}_${teamId}_${amount}`,
      });
      return res.data;
    } catch (err) {
      setBidError(err.message);
      playErrorBuzzer();
      throw err;
    }
  };

  const nominate = async (playerId) => {
    if (!tournament?.id) return;
    const res = await api.post('/auction/nominate', {
      tournamentId: tournament.id,
      playerId,
    });
    await fetchLiveState();
    return res.data;
  };

  const markSold = async () => {
    if (!tournament?.id) return;
    const res = await api.post('/auction/sold', { tournamentId: tournament.id });
    return res.data;
  };

  const markUnsold = async () => {
    if (!tournament?.id) return;
    const res = await api.post('/auction/unsold', { tournamentId: tournament.id });
    return res.data;
  };

  const pause = async () => {
    if (!tournament?.id) return;
    const res = await api.post('/auction/pause', { tournamentId: tournament.id });
    return res.data;
  };

  const resume = async () => {
    if (!tournament?.id) return;
    const res = await api.post('/auction/resume', { tournamentId: tournament.id });
    return res.data;
  };

  const resetTimer = async (seconds = 30) => {
    if (!tournament?.id) return;
    const res = await api.post('/auction/reset-timer', { tournamentId: tournament.id, seconds });
    return res.data;
  };

  const cancelNomination = async () => {
    if (!tournament?.id) return;
    const res = await api.post('/auction/cancel-nomination', { tournamentId: tournament.id });
    await fetchLiveState();
    return res.data;
  };

  return (
    <AuctionSocketContext.Provider
      value={{
        tournament,
        session,
        currentPlayer,
        teams,
        recentBids,
        remainingSeconds,
        isConnected,
        loading,
        bidError,
        soldCelebration,
        placeBid,
        nominate,
        markSold,
        markUnsold,
        pause,
        resume,
        resetTimer,
        cancelNomination,
        refreshState: fetchLiveState,
        clearBidError: () => setBidError(null),
      }}
    >
      {children}
    </AuctionSocketContext.Provider>
  );
}

export function useAuction() {
  const ctx = useContext(AuctionSocketContext);
  if (!ctx) {
    throw new Error('useAuction must be used within AuctionSocketProvider');
  }
  return ctx;
}
