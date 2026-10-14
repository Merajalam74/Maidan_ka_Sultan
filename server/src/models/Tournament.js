import mongoose from 'mongoose';
import { AUCTION_STATUS, DEFAULT_CONFIG } from '../config/constants.js';

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tournament name is required'],
      trim: true,
      default: 'Maidan ke Sultan - Season 5',
    },
    status: {
      type: String,
      enum: Object.values(AUCTION_STATUS),
      default: AUCTION_STATUS.UPCOMING || 'upcoming',
    },
    currency: {
      type: String,
      default: DEFAULT_CONFIG.CURRENCY,
    },
    currencySymbol: {
      type: String,
      default: DEFAULT_CONFIG.CURRENCY_SYMBOL,
    },
    defaultPurse: {
      type: Number,
      default: DEFAULT_CONFIG.DEFAULT_PURSE,
      min: [1, 'Purse must be positive'],
    },
    minBasePrice: {
      type: Number,
      default: DEFAULT_CONFIG.DEFAULT_MIN_BASE_PRICE || 2, // 2 Credits minimum player base price
      min: 1,
    },
    minBidIncrement: {
      type: Number,
      default: DEFAULT_CONFIG.DEFAULT_MIN_BID_INCREMENT,
      min: [1, 'Bid increment must be positive'],
    },
    squadLimit: {
      type: Number,
      default: DEFAULT_CONFIG.DEFAULT_SQUAD_LIMIT,
      min: 1,
    },
    minSquadSize: {
      type: Number,
      default: DEFAULT_CONFIG.MIN_SQUAD_LIMIT,
      min: 1,
    },
    roleLimits: {
      maxBatsmen: { type: Number, default: 6 },
      maxBowlers: { type: Number, default: 6 },
      maxAllRounders: { type: Number, default: 5 },
      maxWicketKeepers: { type: Number, default: 3 },
    },
    countdownDurationSeconds: {
      type: Number,
      default: DEFAULT_CONFIG.DEFAULT_COUNTDOWN_SECONDS,
      min: 5,
    },
    antiSnipingSeconds: {
      type: Number,
      default: DEFAULT_CONFIG.ANTI_SNIPING_WINDOW_SECONDS,
      min: 0,
    },
    antiSnipingExtensionSeconds: {
      type: Number,
      default: DEFAULT_CONFIG.ANTI_SNIPING_EXTENSION_SECONDS,
      min: 1,
    },
    scheduledStartTime: {
      type: Date,
    },
    rulesDescription: {
      type: String,
      default: 'Official Campus Premier League Player Auction. All 6 teams compete with authorized purse limits and squad constraints.',
    },
  },
  {
    timestamps: true,
  }
);

const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;
