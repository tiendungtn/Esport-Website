import { Router } from "express";
import { listMatches } from "../controllers/matches.controller.js";
import {
    createTournament,
    deleteTournament,
    generateBracket,
    getTournament,
    getTournamentRegistrations,
    listTournaments,
    regenerateSchedule,
    registerTeam,
    seedTournament,
    updateRegistrationStatus,
    updateTournament
} from "../controllers/tournaments.controller.js";
import { auth } from "../middleware/auth.js";

const r = Router();

r.get("/", listTournaments);
r.get("/:id/matches", listMatches);
r.get("/:id", getTournament);
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
r.post("/:id/regenerate-schedule", auth(["organizer", "admin"]), regenerateSchedule);

r.get(
  "/:id/registrations",
  auth(["organizer", "admin"]),
  getTournamentRegistrations
);
r.put(
  "/:id/registrations/:regId",
  auth(["organizer", "admin"]),
  updateRegistrationStatus
);

export default r;
