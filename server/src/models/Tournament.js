import mongoose from 'mongoose';
const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  game: String,
  bannerUrl: String,
  description: String,
  rules: String,
  format: { type: String, enum: ['SE','DE','RR'], default: 'SE' },
  status: { type: String, enum: ['draft','open','ongoing','finished'], default: 'draft' },
  maxTeams: { type: Number, default: 16 },
  schedule: {
    regOpen: Date, regClose: Date, startAt: Date, endAt: Date
  },
  organizerUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
tournamentSchema.index({ status: 1, format: 1 });
export default mongoose.model('Tournament', tournamentSchema);
