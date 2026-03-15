import { io } from "socket.io-client";

// Fallback to localhost if env var is missing
const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
export const socket = io(URL, { autoConnect: false });
