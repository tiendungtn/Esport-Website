import User from "../models/User.js";

export async function listUsers(req, res) {
  const { search } = req.query;
  const q = search
    ? {
        $or: [
          { email: new RegExp(search, "i") },
          { "profile.displayName": new RegExp(search, "i") },
        ],
      }
    : {};

  const users = await User.find(q).select("-passwordHash").limit(50);
  res.json(users);
}

export async function getProfile(req, res) {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json(user);
}

export async function updateProfile(req, res) {
  const { displayName, avatar, phone } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (displayName !== undefined) user.profile.displayName = displayName;
  if (avatar !== undefined) user.profile.avatar = avatar;
  if (phone !== undefined) user.profile.phone = phone;

  await user.save();

  // Return the updated user without password hash
  const updatedUser = await User.findById(req.user.id).select("-passwordHash");
  res.json(updatedUser);
}
