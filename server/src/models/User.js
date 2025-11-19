import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin','organizer','player','viewer'], default: 'viewer' },
  profile: {
    displayName: String,
    avatar: String,
    phone: String
  }
}, { timestamps: true });
export default mongoose.model('User', userSchema);
