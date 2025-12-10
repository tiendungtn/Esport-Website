import { z } from "zod";
import Team from "../models/Team.js";

const teamSchema = z.object({
  name: z.string().min(2),
  tag: z.string().optional(),
  game: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

import mongoose from "mongoose";

// Helper to resolve potentially truncated IDs
async function resolveTeamId(id, userId) {
  if (mongoose.isValidObjectId(id)) return id;

  // If ID is malformed (e.g. truncated or has trailing characters), try fuzzy match
  // Sanitize: remove non-hex characters
  const cleanId = String(id).replace(/[^a-fA-F0-9]/g, "");

  // Only attempt recovery if we have a reasonable amount of data (e.g. at least 6 chars)
  if (cleanId.length < 6) return id; // Too short to be safe

  console.warn(
    `[TeamResolve] Attempting to resolve malformed ID: "${id}" -> prefix "${cleanId}" for user ${userId}`
  );

  // Find all teams owned by this user
  const teams = await Team.find({ ownerUser: userId }).select("_id");

  // Look for a prefix match
  const match = teams.find((t) => t._id.toString().startsWith(cleanId));

  if (match) {
    console.log(`[TeamResolve] Resolved "${id}" -> "${match._id}"`);
    return match._id;
  }

  return id; // Return original if no match found
}

export async function createTeam(req, res) {
  const parse = teamSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ message: "Invalid payload" });
  const team = await Team.create({
    ...parse.data,
    ownerUser: req.user.id,
    members: [req.user.id],
  });
  res.status(201).json(team);
}

export async function listMyTeams(req, res) {
  const teams = await Team.find({ ownerUser: req.user.id })
    .sort({ createdAt: -1 })
    .populate("members", "profile email");
  res.json(teams);
}

export async function listTeams(req, res) {
  const { search, game } = req.query;
  const q = {};
  if (search) q.name = new RegExp(search, "i");
  if (game) q.game = game;

  const teams = await Team.find(q)
    .limit(50)
    .populate("ownerUser", "profile email");
  res.json(teams);
}

export async function getTeam(req, res) {
  // getTeam is public, so we might not have req.user.id to narrow down search safely.
  // However, standard get usually relies on valid ID. If generic public access uses malformed ID, it's 404.
  // But if we want to fix it everywhere...
  // For now, let's assume the issue is mainly in Admin (Owner) operations.

  let id = req.params.id;
  // Try simple sanitization for public get
  if (!mongoose.isValidObjectId(id)) {
    // If it looks like a truncated ID (hex only), we can't safely guess without owner context unless we search ALL teams, which is risky for collisions.
    // But stripping trailing dot is always safe.
    if (id.endsWith(".")) id = id.slice(0, -1);
  }

  const team = await Team.findById(id)
    .populate("members", "profile email")
    .populate("ownerUser", "profile email");
  if (!team) return res.status(404).json({ message: "Team not found" });
  res.json(team);
}

export async function updateTeam(req, res) {
  const parse = teamSchema.partial().safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ message: "Invalid payload" });

  const id = await resolveTeamId(req.params.id, req.user.id);

  const team = await Team.findOneAndUpdate(
    { _id: id, ownerUser: req.user.id },
    parse.data,
    { new: true }
  );
  if (!team)
    return res.status(404).json({ message: "Team not found or unauthorized" });
  res.json(team);
}

export async function deleteTeam(req, res) {
  const id = await resolveTeamId(req.params.id, req.user.id);
  const team = await Team.findOneAndDelete({
    _id: id,
    ownerUser: req.user.id,
  });
  if (!team)
    return res.status(404).json({ message: "Team not found or unauthorized" });
  res.json({ message: "Team deleted" });
}

export async function addMember(req, res) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "User ID required" });

  const id = await resolveTeamId(req.params.id, req.user.id);
  const team = await Team.findOne({
    _id: id,
    ownerUser: req.user.id,
  });
  if (!team)
    return res.status(404).json({ message: "Team not found or unauthorized" });

  if (team.members.includes(userId))
    return res.status(400).json({ message: "User already in team" });

  team.members.push(userId);
  await team.save();
  res.json(team);
}

export async function removeMember(req, res) {
  const { userId } = req.body;
  const id = await resolveTeamId(req.params.id, req.user.id);
  const team = await Team.findOne({
    _id: id,
    ownerUser: req.user.id,
  });
  if (!team)
    return res.status(404).json({ message: "Team not found or unauthorized" });

  team.members = team.members.filter((m) => m.toString() !== userId);
  await team.save();
  res.json(team);
}
