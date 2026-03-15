require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const socketHandler = require("./src/controllers/socket.controller");

const app = express();
app.use(cors());
app.use(express.json());

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
