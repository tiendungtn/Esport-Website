import { Router } from 'express';
import { createTeam, listTeams } from '../controllers/teams.controller.js';
import { auth } from '../middleware/auth.js';
const r = Router();
r.get('/', listTeams);
r.post('/', auth(['organizer','player','admin','viewer']), createTeam);
export default r;
