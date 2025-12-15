import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  reportMatch,
  confirmMatch,
  updateMatch,
  rejectMatchResult,
  updateMatchSchedule,
} from "../controllers/matches.controller.js";
const r = Router();
r.patch("/:id/report", auth(["organizer", "player", "admin"]), reportMatch);
r.put("/:id", auth(["organizer", "admin"]), updateMatch);
r.put("/:id/schedule", auth(["organizer", "admin"]), updateMatchSchedule);
r.put("/:id/reject", auth(["organizer", "admin"]), rejectMatchResult);
r.patch("/:id/confirm", auth(["organizer", "admin"]), confirmMatch);
export default r;
