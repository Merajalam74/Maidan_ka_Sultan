import mongoose from 'mongoose';
import { EVENT_TYPES } from '../config/constants.js';

const auctionEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: Object.values(EVENT_TYPES),
      index: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sessionVersion: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

auctionEventSchema.index({ tournamentId: 1, timestamp: -1 });

const AuctionEvent = mongoose.model('AuctionEvent', auctionEventSchema);
export default AuctionEvent;
