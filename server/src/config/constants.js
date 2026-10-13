/**
 * Campus Premier League - Core System Constants & Enums
 */

export const ROLES = Object.freeze({
  SUPERADMIN: 'superadmin',
  AUCTIONEER: 'auctioneer',
  TEAM_OWNER: 'team_owner',
  VIEWER: 'viewer',
});

export const PLAYER_STATUS = Object.freeze({
  AVAILABLE: 'available',
  NOMINATED: 'nominated',
  SOLD: 'sold',
  UNSOLD: 'unsold',
});

export const AUCTION_STATUS = Object.freeze({
  UPCOMING: 'upcoming',
  IDLE: 'idle',
  ACTIVE: 'active',
  LIVE: 'live',
  PAUSED: 'paused',
  COMPLETED: 'completed',
});

export const PLAYER_ROLES = Object.freeze({
  BATSMAN: 'Batsman',
  BOWLER: 'Bowler',
  ALL_ROUNDER: 'All-Rounder',
  WICKET_KEEPER: 'Wicket-Keeper',
});

export const PLAYER_CATEGORIES = Object.freeze({
  MARQUEE: 'Marquee',
  CATEGORY_A: 'Category A',
  CATEGORY_B: 'Category B',
  EMERGING: 'Emerging',
});

export const EVENT_TYPES = Object.freeze({
  AUCTION_STARTED: 'AUCTION_STARTED',
  AUCTION_PAUSED: 'AUCTION_PAUSED',
  AUCTION_RESUMED: 'AUCTION_RESUMED',
  PLAYER_NOMINATED: 'PLAYER_NOMINATED',
  BID_ACCEPTED: 'BID_ACCEPTED',
  BID_REJECTED: 'BID_REJECTED',
  PLAYER_SOLD: 'PLAYER_SOLD',
  PLAYER_UNSOLD: 'PLAYER_UNSOLD',
  TRANSACTION_REVERSED: 'TRANSACTION_REVERSED',
  TIMER_RESET: 'TIMER_RESET',
  COUNTDOWN_TICK: 'COUNTDOWN_TICK',
});

export const DEFAULT_CONFIG = Object.freeze({
  DEFAULT_PURSE: 10000000, // ₹1,00,00,000 (1 Crore)
  DEFAULT_SQUAD_LIMIT: 15,
  MIN_SQUAD_LIMIT: 11,
  DEFAULT_COUNTDOWN_SECONDS: 30,
  ANTI_SNIPING_WINDOW_SECONDS: 10,
  ANTI_SNIPING_EXTENSION_SECONDS: 15,
  DEFAULT_MIN_BID_INCREMENT: 50000, // ₹50,000
  CURRENCY: 'INR',
  CURRENCY_SYMBOL: '₹',
});

// Standard Tiered Bid Increments in INR
export const DEFAULT_BID_TIERS = Object.freeze([
  { maxAmount: 1000000, increment: 25000 },    // Up to 10 Lakh: +25k
  { maxAmount: 2500000, increment: 50000 },    // 10L - 25L: +50k
  { maxAmount: 5000000, increment: 100000 },   // 25L - 50L: +1 Lakh
  { maxAmount: Infinity, increment: 200000 },  // Above 50L: +2 Lakh
]);
