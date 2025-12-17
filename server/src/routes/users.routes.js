import { Router } from "express";
import {
    createUser,
    deleteUser,
    getMyUpcomingMatches,
    getProfile,
    listUsers,
    updateProfile,
    updateUser,
} from "../controllers/users.controller.js";
import { auth } from "../middleware/auth.js";

const r = Router();

r.get("/", auth(["organizer", "admin", "player"]), listUsers);
r.get("/me", auth(), getProfile);
r.put("/me", auth(), updateProfile);
r.get("/me/upcoming-matches", auth(), getMyUpcomingMatches);
r.post("/", auth(["admin"]), createUser);
r.put("/:id", auth(["admin"]), updateUser);
r.delete("/:id", auth(["admin"]), deleteUser);

export default r;
