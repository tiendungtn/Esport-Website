import { Router } from "express";
import { listUsers } from "../controllers/users.controller.js";
import { auth } from "../middleware/auth.js";

const r = Router();

r.get("/", auth(["organizer", "admin", "player"]), listUsers);

export default r;
