import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

const tournamentMembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.VIEWER,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A user can have only one role per tournament
tournamentMembershipSchema.index({ userId: 1, tournamentId: 1 }, { unique: true });

const TournamentMembership = mongoose.model('TournamentMembership', tournamentMembershipSchema);
export default TournamentMembership;
