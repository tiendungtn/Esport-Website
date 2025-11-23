import { Router } from "express";
import {
  listUsers,
  getProfile,
  updateProfile,
} from "../controllers/users.controller.js";
import { auth } from "../middleware/auth.js";

const r = Router();

r.get("/", auth(["organizer", "admin", "player"]), listUsers);
r.get("/me", auth(), getProfile);
r.put("/me", auth(), updateProfile);

export default r;
