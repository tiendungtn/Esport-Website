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
