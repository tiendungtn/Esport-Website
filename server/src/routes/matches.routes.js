import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  reportMatch,
  confirmMatch,
  updateMatch,
} from "../controllers/matches.controller.js";
const r = Router();
r.patch("/:id/report", auth(["organizer", "player", "admin"]), reportMatch);
r.put("/:id", auth(["organizer", "admin"]), updateMatch);
r.patch("/:id/confirm", auth(["organizer", "admin"]), confirmMatch);
export default r;
