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
  DEFAULT_PURSE: 100, // 100 Credits per team
  DEFAULT_SQUAD_LIMIT: 15,
  MIN_SQUAD_LIMIT: 11,
  DEFAULT_COUNTDOWN_SECONDS: 30,
  ANTI_SNIPING_WINDOW_SECONDS: 10,
  ANTI_SNIPING_EXTENSION_SECONDS: 15,
  DEFAULT_MIN_BID_INCREMENT: 1, // 1 Credit minimum increment
  DEFAULT_MIN_BASE_PRICE: 2, // 2 Credits minimum base price
  CURRENCY: 'CREDITS',
  CURRENCY_SYMBOL: 'CR',
});

// Standard Tiered Bid Increments in Credits
export const DEFAULT_BID_TIERS = Object.freeze([
  { maxAmount: 20, increment: 1 },    // Up to 20 Credits: +1 Credit
  { maxAmount: 50, increment: 2 },    // 20 - 50 Credits: +2 Credits
  { maxAmount: Infinity, increment: 5 }, // Above 50 Credits: +5 Credits
]);
