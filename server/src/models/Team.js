import mongoose from "mongoose";
const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tag: String,
    game: String,
    logoUrl: String,
    ownerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);
teamSchema.index({ name: 1, game: 1 }, { unique: true });
export default mongoose.model("Team", teamSchema);
