import mongoose from 'mongoose';
const matchSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  stage: { type: Number, default: 1 },
  round: { type: Number, default: 1 },
  bestOf: { type: Number, default: 1 },
  teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  scoreA: { type: Number, default: 0 },
  scoreB: { type: Number, default: 0 },
  state: { type: String, enum: ['scheduled','live','reported','confirmed','disputed','final'], default: 'scheduled' },
  scheduledAt: Date,
  report: { submitter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, proofUrls: [String], note: String },
  nextMatchIdA: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  nextMatchIdB: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' }
}, { timestamps: true });
matchSchema.index({ tournamentId: 1, round: 1 });
export default mongoose.model('Match', matchSchema);
