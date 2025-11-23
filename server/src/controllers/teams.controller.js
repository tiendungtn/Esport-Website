import { z } from "zod";
import Team from "../models/Team.js";

const teamSchema = z.object({
  name: z.string().min(2),
  tag: z.string().optional(),
  game: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

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
  const team = await Team.findById(req.params.id)
    .populate("members", "profile email")
    .populate("ownerUser", "profile email");
  if (!team) return res.status(404).json({ message: "Team not found" });
  res.json(team);
}

export async function updateTeam(req, res) {
  const parse = teamSchema.partial().safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ message: "Invalid payload" });

  const team = await Team.findOneAndUpdate(
    { _id: req.params.id, ownerUser: req.user.id },
    parse.data,
    { new: true }
  );
  if (!team)
    return res.status(404).json({ message: "Team not found or unauthorized" });
  res.json(team);
}

export async function deleteTeam(req, res) {
  const team = await Team.findOneAndDelete({
    _id: req.params.id,
    ownerUser: req.user.id,
  });
  if (!team)
    return res.status(404).json({ message: "Team not found or unauthorized" });
  res.json({ message: "Team deleted" });
}

export async function addMember(req, res) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "User ID required" });

  const team = await Team.findOne({
    _id: req.params.id,
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
  const team = await Team.findOne({
    _id: req.params.id,
    ownerUser: req.user.id,
  });
  if (!team)
    return res.status(404).json({ message: "Team not found or unauthorized" });

  team.members = team.members.filter((m) => m.toString() !== userId);
  await team.save();
  res.json(team);
}
