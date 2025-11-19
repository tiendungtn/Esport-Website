import mongoose from 'mongoose';
const regSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  seed: Number
}, { timestamps: true });
regSchema.index({ tournamentId: 1, teamId: 1 }, { unique: true });
export default mongoose.model('Registration', regSchema);
