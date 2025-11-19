import { Router } from "express";
import {
  createTeam,
  listTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
} from "../controllers/teams.controller.js";
import { auth } from "../middleware/auth.js";
const r = Router();
r.get("/", listTeams);
r.get("/:id", getTeam);
r.post("/", auth(["organizer", "player", "admin", "viewer"]), createTeam);
r.put("/:id", auth(["organizer", "player", "admin"]), updateTeam);
r.delete("/:id", auth(["organizer", "player", "admin"]), deleteTeam);
r.post("/:id/members", auth(["organizer", "player", "admin"]), addMember);
r.delete("/:id/members", auth(["organizer", "player", "admin"]), removeMember);
export default r;
