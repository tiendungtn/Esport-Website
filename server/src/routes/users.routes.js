import { Router } from "express";
import {
  listUsers,
  getProfile,
  updateProfile,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/users.controller.js";
import { auth } from "../middleware/auth.js";

const r = Router();

r.get("/", auth(["organizer", "admin", "player"]), listUsers);
r.get("/me", auth(), getProfile);
r.put("/me", auth(), updateProfile);
r.post("/", auth(["admin"]), createUser);
r.put("/:id", auth(["admin"]), updateUser);
r.delete("/:id", auth(["admin"]), deleteUser);

export default r;
