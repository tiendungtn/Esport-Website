import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  displayName: z.string().min(1),
  role: z.enum(["admin", "organizer", "player", "viewer"]).optional(),
});

export async function listUsers(req, res) {
  const { search } = req.query;
  const q = {
    role: { $ne: "admin" }, // Exclude admins
    ...(search
      ? {
          $or: [
            { email: new RegExp(search, "i") },
            { "profile.displayName": new RegExp(search, "i") },
          ],
        }
      : {}),
  };

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

export async function createUser(req, res) {
  const parse = userSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const { email, password, displayName, role } = parse.data;

  if (!password) {
    return res
      .status(400)
      .json({ message: "Password is required for new users" });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    passwordHash,
    role: role || "player",
    profile: { displayName },
  });

  res.status(201).json({
    id: user._id,
    email: user.email,
    role: user.role,
    displayName: user.profile?.displayName,
  });
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { displayName, email, role, password } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (email && email !== user.email) {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already in use" });
    }
    user.email = email;
  }

  if (displayName) user.profile.displayName = displayName;
  if (role) user.role = role;
  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  await user.save();

  res.json({
    id: user._id,
    email: user.email,
    role: user.role,
    displayName: user.profile?.displayName,
  });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.status(204).send();
}
