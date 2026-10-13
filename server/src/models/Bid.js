import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    auctionSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionSession',
      required: true,
      index: true,
    },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      index: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    bidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: [1, 'Bid amount must be positive'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isAccepted: {
      type: Boolean,
      default: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

bidSchema.index({ tournamentId: 1, playerId: 1, timestamp: -1 });
bidSchema.index({ teamId: 1, timestamp: -1 });

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;
