import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      index: true,
    },
    winningTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    winningBidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid',
      default: null,
    },
    finalPurchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    settledAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['completed', 'reversed'],
      default: 'completed',
      index: true,
    },
    reversalReason: {
      type: String,
      default: '',
    },
    reversedAt: {
      type: Date,
      default: null,
    },
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Guarantee at most one active completed purchase per player per tournament
purchaseSchema.index(
  { tournamentId: 1, playerId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'completed' },
  }
);

purchaseSchema.index({ winningTeamId: 1, status: 1 });

const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;
