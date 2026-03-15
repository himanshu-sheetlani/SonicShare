const roomManager = require("../services/roomManager");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // --- Room Management ---
    socket.on("create-room", () => {
      const room = roomManager.createRoom();
      roomManager.joinRoom(room.roomId, socket.id);
      socket.join(room.roomId);
      socket.emit("room-joined", room);
      console.log(`User ${socket.id} created room ${room.roomId}`);
    });

    socket.on("join-room", (roomId) => {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }
      roomManager.joinRoom(roomId, socket.id);
      socket.join(roomId);
      socket.emit("room-joined", room);
      io.to(roomId).emit("user-joined", socket.id);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // --- Playback Sync ---
    socket.on("intent:play", ({ roomId, timestamp }) => {
      console.log(`Received intent:play for room ${roomId} at ${timestamp}`);
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      // Update state
      room.state.playbackState = "playing";
      room.state.baseTimestamp = timestamp || 0;

      // Server time for sync (with buffer)
      const NOW = Date.now();
      const BUFFER = 500;
      room.state.lastSyncTime = NOW + BUFFER;

      // Broadcast
      io.to(roomId).emit("sync-update", {
        playbackState: "playing",
        baseTimestamp: room.state.baseTimestamp,
        playAt: room.state.lastSyncTime,
      });
    });

    socket.on("intent:pause", ({ roomId, timestamp }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      room.state.playbackState = "paused";
      room.state.baseTimestamp = timestamp; // Save where we paused
      room.state.lastSyncTime = Date.now();

      io.to(roomId).emit("sync-update", {
        playbackState: "paused",
        baseTimestamp: room.state.baseTimestamp,
        lastSyncTime: room.state.lastSyncTime,
      });
    });

    socket.on("intent:seek", ({ roomId, timestamp }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      room.state.baseTimestamp = timestamp;

      if (room.state.playbackState === "playing") {
        const NOW = Date.now();
        const BUFFER = 500;
        room.state.lastSyncTime = NOW + BUFFER;

        io.to(roomId).emit("sync-update", {
          playbackState: "playing",
          baseTimestamp: room.state.baseTimestamp,
          playAt: room.state.lastSyncTime,
          isSeek: true,
        });
      } else {
        io.to(roomId).emit("sync-update", {
          playbackState: "paused",
          baseTimestamp: room.state.baseTimestamp,
          lastSyncTime: Date.now(),
          isSeek: true,
        });
      }
    });

    // --- Playlist Management ---
    socket.on("intent:add-song", async ({ roomId, song }) => {
      console.log(
        `Received add-song intent for room ${roomId}. Song payload:`,
        JSON.stringify(song, null, 2),
      );
      const room = roomManager.getRoom(roomId);
      if (!room) {
        console.log(`Room ${roomId} not found for add-song`);
        return;
      }

      // Check if song already in playlist
      if (room.state.playlist.some((s) => s.id === song.id)) return;

      // No need to fetch full info anymore, local song object has everything needed
      let fullSong = song;

      // Add to playlist or current song
      console.log(`Adding song to room ${roomId} state...`);

      // Ensure playlist is initialized
      if (!room.state.playlist) {
        room.state.playlist = [];
      }

      // Update preferences
      if (fullSong.genre) {
        room.state.roomPreferences.genreScores[fullSong.genre] =
          (room.state.roomPreferences.genreScores[fullSong.genre] || 0) + 2;
      }

      // If nothing playing, start this song
      if (!room.state.currentSong) {
        console.log("Setting as Current Song and Auto-Playing");
        room.state.currentSong = fullSong;
        room.state.playbackState = "playing";
        room.state.baseTimestamp = 0;
        room.state.lastSyncTime = Date.now() + 500; // Buffer for client sync

        // Remove from playlist just in case
        room.state.playlist = room.state.playlist.filter(
          (s) => s.id !== fullSong.id,
        );
        console.log(
          "Emitting room-state:",
          JSON.stringify(room.state.currentSong, null, 2),
        );
        io.to(roomId).emit("room-state", room);
      } else {
        console.log("Adding to Playlist (Queue)");
        room.state.playlist.push(fullSong);
        console.log(
          `Current Playlist State:`,
          JSON.stringify(room.state.playlist, null, 2),
        );
        io.to(roomId).emit("playlist-update", room.state.playlist);
      }
    });

    socket.on("intent:skip", async ({ roomId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      // Logic to move next song from playlist to current
      await playNextSong(room, roomId);
    });

    socket.on("intent:song-ended", async ({ roomId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      // Logic similar to skip, but maybe different scoring
      await playNextSong(room, roomId);
    });

    socket.on("intent:remove-song", ({ roomId, songId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      room.state.playlist = room.state.playlist.filter((s) => s.id !== songId);
      io.to(roomId).emit("playlist-update", room.state.playlist);
    });

    // --- Helper: Play Next ---
    async function playNextSong(room, roomId) {
      if (room.state.playlist.length > 0) {
        const nextSong = room.state.playlist.shift();
        room.state.currentSong = nextSong;
        room.state.playbackState = "playing"; // Auto-play next
        room.state.baseTimestamp = 0;

        const NOW = Date.now();
        const BUFFER = 500;
        room.state.lastSyncTime = NOW + BUFFER;

        io.to(roomId).emit("room-state", room); // Full update since currentSong changed
      } else {
        // Playlist empty
        room.state.currentSong = null;
        room.state.playbackState = "paused";
        io.to(roomId).emit("room-state", room); // Stop
      }
    }

    // --- Disconnect ---
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      roomManager.removeUserFromAllRooms(socket.id);
    });
  });
};
