import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  createTournament,
  listTournaments,
  getTournament,
  registerTeam,
  seedTournament,
  generateBracket,
} from "../controllers/tournaments.controller.js";

const r = Router();

r.get("/", listTournaments);
r.get("/:id", getTournament);
r.post("/", auth(["organizer", "admin"]), createTournament);
r.post(
  "/:id/registrations",
  auth(["organizer", "player", "admin"]),
  registerTeam
);
r.post("/:id/seed", auth(["organizer", "admin"]), seedTournament);
r.post("/:id/generate-bracket", auth(["organizer", "admin"]), generateBracket);

export default r;
