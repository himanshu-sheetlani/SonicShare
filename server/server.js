require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const socketHandler = require("./src/controllers/socket.controller");
const { uploadSong, getSongsFromFirestore, deleteSong } = require("./src/controllers/upload.controller");

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for memory storage (since we're uploading to Firebase Cloud Storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const { getSongs, playSong } = require("./src/controllers/songs.controller");

app.get("/", (req, res) => {
  res.send("Backend is working.");
});

// Serve local downloaded songs
app.use("/songs", express.static(path.join(__dirname, "public/songs")));

// Get all songs from public/songs folder
app.get("/api/songs", getSongs);

// Play specific song from public/songs folder
app.get("/api/songs/:fileName", playSong);

// Upload song to Firebase Cloud Storage
app.post("/api/upload", upload.single("file"), uploadSong);

// Get all songs from Firestore
app.get("/api/firestore-songs", getSongsFromFirestore);

// Delete song from Firestore and Cloud Storage
app.delete("/api/songs/:songId", deleteSong);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize socket logic
socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
