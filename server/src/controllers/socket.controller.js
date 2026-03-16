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

    socket.on("intent:skip", async ({ roomId, direction = "next" }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      // Logic to move next/previous song from playlist to current
      await playNextSong(room, roomId, direction);
    });

    socket.on("intent:song-ended", async ({ roomId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      // Logic similar to skip, but maybe different scoring
      await playNextSong(room, roomId, "next");
    });

    socket.on("intent:remove-song", ({ roomId, songId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      room.state.playlist = room.state.playlist.filter((s) => s.id !== songId);
      io.to(roomId).emit("playlist-update", room.state.playlist);
    });

    // --- Helper: Get Random Song ---
    async function getRandomSong() {
      try {
        const path = require("path");
        const fs = require("fs");
        const jsmediatags = require("jsmediatags");
        
        const songsDir = path.join(__dirname, "../../public/songs");
        
        if (!fs.existsSync(songsDir)) {
          console.warn("Songs directory does not exist:", songsDir);
          return null;
        }

        const files = fs.readdirSync(songsDir);
        const audioExtensions = [".mp3", ".wav", ".flac", ".m4a"];
        const audioFiles = files.filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return audioExtensions.includes(ext);
        });

        if (audioFiles.length === 0) {
          console.warn("No audio files found in songs directory");
          return null;
        }

        const randomFileName = audioFiles[Math.floor(Math.random() * audioFiles.length)];
        const filePath = path.join(songsDir, randomFileName);
        
        return new Promise((resolve) => {
          jsmediatags.read(filePath, {
            onSuccess: (tag) => {
              const tags = tag.tags;
              let albumArt = null;

              if (tags.picture) {
                try {
                  const picture = tags.picture;
                  const base64String = btoa(
                    String.fromCharCode.apply(null, picture.data)
                  );
                  albumArt = `data:${picture.format};base64,${base64String}`;
                } catch (err) {
                  console.warn(`Error processing album art:`, err.message);
                }
              }

              const songObj = {
                id: randomFileName,
                fileName: randomFileName,
                title: tags.title || randomFileName.replace(/\.[^/.]+$/, ""),
                artist: tags.artist || "Unknown Artist",
                album: tags.album || "Unknown Album",
                albumArt: albumArt,
                duration: tags.length || 0,
                url: `/songs/${randomFileName}`,
                streamUrl: `/songs/${randomFileName}`,
              };
              
              console.log("Random song selected:", songObj.title, "URL:", songObj.streamUrl);
              resolve(songObj);
            },
            onError: (error) => {
              console.warn("Error reading tags for random song:", error.message);
              const songObj = {
                id: randomFileName,
                fileName: randomFileName,
                title: randomFileName.replace(/\.[^/.]+$/, ""),
                artist: "Unknown Artist",
                album: "Unknown Album",
                albumArt: null,
                duration: 0,
                url: `/songs/${randomFileName}`,
                streamUrl: `/songs/${randomFileName}`,
              };
              
              console.log("Random song (no metadata):", songObj.title, "URL:", songObj.streamUrl);
              resolve(songObj);
            },
          });
        });
      } catch (error) {
        console.error("Error getting random song:", error);
        return null;
      }
    }

    // --- Helper: Play Next ---
    async function playNextSong(room, roomId, direction = "next") {
      if (direction === "previous") {
        // Go back to previous song
        if (room.state.playHistory.length > 0) {
          // Put current song back at start of playlist
          if (room.state.currentSong) {
            room.state.playlist.unshift(room.state.currentSong);
          }
          
          // Get last song from history
          room.state.currentSong = room.state.playHistory.pop();
          room.state.playbackState = "playing";
          room.state.baseTimestamp = 0;

          const NOW = Date.now();
          const BUFFER = 500;
          room.state.lastSyncTime = NOW + BUFFER;

          console.log("Playing previous song:", room.state.currentSong.title, "streamUrl:", room.state.currentSong.streamUrl);
          io.to(roomId).emit("room-state", room);
        } else {
          // No history, restart current song
          if (room.state.currentSong) {
            room.state.baseTimestamp = 0;
            room.state.playbackState = "playing";

            const NOW = Date.now();
            const BUFFER = 500;
            room.state.lastSyncTime = NOW + BUFFER;

            console.log("Restarting current song:", room.state.currentSong.title);
            io.to(roomId).emit("sync-update", {
              playbackState: "playing",
              baseTimestamp: 0,
              playAt: room.state.lastSyncTime,
            });
          }
        }
      } else {
        // Play next song
        // Add current song to history before moving to next
        if (room.state.currentSong) {
          room.state.playHistory.push(room.state.currentSong);
        }

        if (room.state.playlist.length > 0) {
          const nextSong = room.state.playlist.shift();
          room.state.currentSong = nextSong;
          room.state.playbackState = "playing";
          room.state.baseTimestamp = 0;

          const NOW = Date.now();
          const BUFFER = 500;
          room.state.lastSyncTime = NOW + BUFFER;

          console.log("Playing next song from queue:", nextSong.title, "streamUrl:", nextSong.streamUrl);
          io.to(roomId).emit("room-state", room);
        } else {
          // Playlist empty - play random song
          console.log(`Playlist empty for room ${roomId}, fetching random song...`);
          const randomSong = await getRandomSong();
          
          if (randomSong) {
            room.state.currentSong = randomSong;
            room.state.playbackState = "playing";
            room.state.baseTimestamp = 0;

            const NOW = Date.now();
            const BUFFER = 500;
            room.state.lastSyncTime = NOW + BUFFER;

            console.log(`Playing random song in room ${roomId}:`, randomSong.title, "streamUrl:", randomSong.streamUrl);
            io.to(roomId).emit("room-state", room);
          } else {
            // No songs available
            console.log(`No songs available for room ${roomId}`);
            room.state.currentSong = null;
            room.state.playbackState = "paused";
            io.to(roomId).emit("room-state", room);
          }
        }
      }
    }

    // --- Disconnect ---
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      roomManager.removeUserFromAllRooms(socket.id);
    });
  });
};
