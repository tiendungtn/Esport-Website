import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { listMatches, reportMatch, confirmMatch } from '../controllers/matches.controller.js';
const r = Router();
r.get('/tournaments/:id/matches', listMatches);
r.patch('/matches/:id/report', auth(['organizer','player','admin']), reportMatch);
r.patch('/matches/:id/confirm', auth(['organizer','admin']), confirmMatch);
export default r;
