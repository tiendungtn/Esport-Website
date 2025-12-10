import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import teamRoutes from "./routes/teams.routes.js";
import tournamentRoutes from "./routes/tournaments.routes.js";
import matchRoutes from "./routes/matches.routes.js";
import usersRoutes from "./routes/users.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- các middleware ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(",") || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});
app.use("/api", apiLimiter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- các route ---
app.use("/api/auth", authRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/matches", matchRoutes); // matchRoutes định nghĩa cho /tournaments/:id/matches & /matches/:id/*
app.use("/api/users", usersRoutes);
app.use("/api/upload", uploadRoutes);

// --- xử lý lỗi ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL?.split(",") || "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on("join", (room) => {
    console.log(`Socket ${socket.id} joining room: ${room}`);
    socket.join(room);
  });
});

const PORT = process.env.PORT || 4000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mern_esports";

connectDB(MONGO_URI).then(() => {
  server.listen(PORT, () => {
    console.log(`API on http://localhost:${PORT}`);
  });
});
