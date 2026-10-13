import mongoose from 'mongoose';
import { DEFAULT_CONFIG } from '../config/constants.js';

const teamSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: 100,
    },
    shortCode: {
      type: String,
      required: [true, 'Team short code is required'],
      trim: true,
      uppercase: true,
      maxlength: 5,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    primaryColor: {
      type: String,
      default: '#3B82F6', // Blue default
    },
    secondaryColor: {
      type: String,
      default: '#1E40AF',
    },
    initialPurse: {
      type: Number,
      required: true,
      default: DEFAULT_CONFIG.DEFAULT_PURSE,
      min: 0,
    },
    remainingPurse: {
      type: Number,
      required: true,
      default: DEFAULT_CONFIG.DEFAULT_PURSE,
      min: 0,
    },
    committedSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxSquadSize: {
      type: Number,
      default: DEFAULT_CONFIG.DEFAULT_SQUAD_LIMIT,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness of team name per tournament
teamSchema.index({ tournamentId: 1, name: 1 }, { unique: true });
teamSchema.index({ tournamentId: 1, shortCode: 1 }, { unique: true });

// Virtual for purchased count
teamSchema.virtual('purchasedCount', {
  ref: 'Purchase',
  localField: '_id',
  foreignField: 'winningTeamId',
  count: true,
  match: { status: 'completed' },
});

// Reconcile purse helper method
teamSchema.methods.reconcilePurse = function (spentAmount) {
  this.committedSpent = spentAmount;
  this.remainingPurse = Math.max(0, this.initialPurse - spentAmount);
};

const Team = mongoose.model('Team', teamSchema);
export default Team;
