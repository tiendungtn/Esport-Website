import { io } from "socket.io-client";

// URL server backend
const URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const socket = io(URL, {
  autoConnect: true,
  withCredentials: true,
});
