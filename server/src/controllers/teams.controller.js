import { z } from 'zod';
import Team from '../models/Team.js';

const teamSchema = z.object({
  name: z.string().min(2),
  tag: z.string().optional(),
  logoUrl: z.string().url().optional()
});

export async function createTeam(req, res) {
  const parse = teamSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Invalid payload' });
  const team = await Team.create({ ...parse.data, ownerUser: req.user.id, members: [req.user.id] });
  res.status(201).json(team);
}

export async function listTeams(req, res) {
  const { search } = req.query;
  const q = search ? { name: new RegExp(search, 'i') } : {};
  const teams = await Team.find(q).limit(50);
  res.json(teams);
}
