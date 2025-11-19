# MERN eSports Backend (Skeleton)

A minimal Express + MongoDB API for an eSports tournament system.

## Quickstart
```bash
cp .env
npm i
npm run dev
```
Default: http://localhost:4000

## API (highlights)
- POST /api/auth/register
- POST /api/auth/login
- POST /api/teams
- GET  /api/tournaments
- POST /api/tournaments
- POST /api/tournaments/:id/registrations
- GET  /api/tournaments/:id/matches
- PATCH /api/matches/:id/report
- PATCH /api/matches/:id/confirm
```

This is a starter; extend routes/controllers as needed.
