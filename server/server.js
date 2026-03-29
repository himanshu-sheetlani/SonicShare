require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { uploadSong, getSongsFromFirestore, deleteSong, getSongById } = require("./src/controllers/upload.controller");
const {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  heartbeat,
  updateRoomState,
  postSignal,
  getSignals,
} = require("./src/controllers/room.controller");

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for memory storage (since we're uploading to Firebase Cloud Storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

app.get("/", (req, res) => {
  res.send("Backend is working.");
});

// Upload song to Firebase Cloud Storage
app.post("/api/upload", upload.single("file"), uploadSong);

// Get all songs from Firestore
app.get("/api/firestore-songs", getSongsFromFirestore);

// Get specific song from Firestore
app.get("/api/firestore-songs/:songId", getSongById);

// Delete song from Firestore and Cloud Storage
app.delete("/api/songs/:songId", deleteSong);

// Room lifecycle and WebRTC signaling
app.post("/api/rooms", createRoom);
app.post("/api/rooms/:roomId/join", joinRoom);
app.post("/api/rooms/:roomId/leave", leaveRoom);
app.get("/api/rooms/:roomId", getRoom);
app.post("/api/rooms/:roomId/heartbeat", heartbeat);
app.post("/api/rooms/:roomId/state", updateRoomState);
app.post("/api/rooms/:roomId/signals", postSignal);
app.get("/api/rooms/:roomId/signals", getSignals);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
