import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  createTournament,
  listTournaments,
  getTournament,
  registerTeam,
  seedTournament,
  generateBracket,
  updateTournament,
  deleteTournament,
} from "../controllers/tournaments.controller.js";
import { listMatches } from "../controllers/matches.controller.js";

const r = Router();

r.get("/", listTournaments);
r.get("/:id", getTournament);
r.get("/:id/matches", listMatches);
r.post("/", auth(["organizer", "admin"]), createTournament);
r.put("/:id", auth(["organizer", "admin"]), updateTournament);
r.delete("/:id", auth(["organizer", "admin"]), deleteTournament);
r.post(
  "/:id/registrations",
  auth(["organizer", "player", "admin"]),
  registerTeam
);
r.post("/:id/seed", auth(["organizer", "admin"]), seedTournament);
r.post("/:id/generate-bracket", auth(["organizer", "admin"]), generateBracket);

export default r;
