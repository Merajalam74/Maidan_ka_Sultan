import mongoose from 'mongoose';
import { AUCTION_STATUS } from '../config/constants.js';

const auctionSessionSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      unique: true,
      index: true,
    },
    currentPlayerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(AUCTION_STATUS),
      default: AUCTION_STATUS.IDLE,
      index: true,
    },
    currentBid: {
      type: Number,
      default: 0,
      min: 0,
    },
    leadingTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    leadingBidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    sessionVersion: {
      type: Number,
      default: 0,
    },
    pausedRemainingSeconds: {
      type: Number,
      default: 0,
    },
    isSettling: {
      type: Boolean,
      default: false,
    },
    lastBidTimestamp: {
      type: Date,
      default: null,
    },
    timerStartedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const AuctionSession = mongoose.model('AuctionSession', auctionSessionSchema);
export default AuctionSession;
