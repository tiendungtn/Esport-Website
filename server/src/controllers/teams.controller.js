import { z } from "zod";
import Team from "../models/Team.js";

const teamSchema = z.object({
  name: z.string().min(2),
  tag: z.string().optional(),
  game: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

import mongoose from "mongoose";

// Hàm hỗ trợ xử lý ID bị cắt bớt
async function resolveTeamId(id, userId) {
  if (mongoose.isValidObjectId(id)) return id;

  // Nếu ID bị lỗi (cắt bớt hoặc ký tự lạ), thử khớp mờ
  // Làm sạch: bỏ ký tự không phải hex
  const cleanId = String(id).replace(/[^a-fA-F0-9]/g, "");

  // Chỉ thử khôi phục nếu đủ độ dài
  if (cleanId.length < 6) return id; // Quá ngắn để an toàn

  console.warn(
    `[TeamResolve] Attempting to resolve malformed ID: "${id}" -> prefix "${cleanId}" for user ${userId}`
  );

  // Tìm tất cả team của user này
  const teams = await Team.find({ ownerUser: userId }).select("_id");

  // Tìm team có ID bắt đầu bằng chuỗi này
  const match = teams.find((t) => t._id.toString().startsWith(cleanId));

  if (match) {
    console.log(`[TeamResolve] Resolved "${id}" -> "${match._id}"`);
    return match._id;
  }

  return id; // Trả về ID gốc nếu không tìm thấy
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
  // getTeam là public, có thể không có req.user.id
  // Tuy nhiên, public get thường dựa vào ID hợp lệ. Nếu public access sai ID -> 404.
  // Giả sử vấn đề chủ yếu ở Admin (Owner).

  let id = req.params.id;
  // Thử làm sạch đơn giản cho public get
  if (!mongoose.isValidObjectId(id)) {
    // Nếu ID bị cắt (chỉ hex), không thể đoán an toàn nếu không có ngữ cảnh owner.
    // Nhưng bỏ dấu chấm cuối cùng thì an toàn.
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
