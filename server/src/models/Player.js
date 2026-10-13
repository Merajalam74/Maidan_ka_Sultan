import mongoose from 'mongoose';
import { PLAYER_STATUS, PLAYER_ROLES, PLAYER_CATEGORIES } from '../config/constants.js';

const playerSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    externalId: {
      type: String,
      trim: true,
      default: '',
    },
    name: {
      type: String,
      required: [true, 'Player name is required'],
      trim: true,
      maxlength: 120,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: 'General',
    },
    academicYear: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    role: {
      type: String,
      enum: Object.values(PLAYER_ROLES),
      required: [true, 'Playing role is required'],
    },
    battingStyle: {
      type: String,
      trim: true,
      default: 'Right-hand bat',
    },
    bowlingStyle: {
      type: String,
      trim: true,
      default: 'Right-arm medium',
    },
    category: {
      type: String,
      enum: Object.values(PLAYER_CATEGORIES),
      default: PLAYER_CATEGORIES.CATEGORY_A,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(PLAYER_STATUS),
      default: PLAYER_STATUS.AVAILABLE,
      index: true,
    },
    winningTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    soldPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    nominationOrder: {
      type: Number,
      default: 0,
    },
    stats: {
      matches: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
      highestScore: { type: String, default: '0' },
      bestBowling: { type: String, default: '0/0' },
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

playerSchema.index({ tournamentId: 1, status: 1 });
playerSchema.index({ tournamentId: 1, nominationOrder: 1 });
playerSchema.index({ tournamentId: 1, role: 1 });
playerSchema.index({ tournamentId: 1, externalId: 1 });

const Player = mongoose.model('Player', playerSchema);
export default Player;
