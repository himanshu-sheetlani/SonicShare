const roomManager = require('./roomManager');
const recommendationEngine = require('./recommendationEngine');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // --- Room Management ---
        socket.on('create-room', () => {
            const room = roomManager.createRoom();
            roomManager.joinRoom(room.roomId, socket.id);
            socket.join(room.roomId);
            socket.emit('room-joined', room);
            console.log(`User ${socket.id} created room ${room.roomId}`);
        });

        socket.on('join-room', (roomId) => {
            const room = roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            roomManager.joinRoom(roomId, socket.id);
            socket.join(roomId);
            socket.emit('room-joined', room);
            io.to(roomId).emit('user-joined', socket.id);
            console.log(`User ${socket.id} joined room ${roomId}`);
        });

        // --- Playback Sync ---
        socket.on('intent:play', ({ roomId, timestamp }) => {
            const room = roomManager.getRoom(roomId);
            if (!room) return;

            // Update state
            room.state.playbackState = 'playing';
            room.state.baseTimestamp = timestamp || 0; 
            
            // Server time for sync (with buffer)
            const NOW = Date.now();
            const BUFFER = 500;
            room.state.lastSyncTime = NOW + BUFFER; 

            // Broadcast
            io.to(roomId).emit('sync-update', {
                playbackState: 'playing',
                baseTimestamp: room.state.baseTimestamp,
                playAt: room.state.lastSyncTime
            });
        });

        socket.on('intent:pause', ({ roomId, timestamp }) => {
            const room = roomManager.getRoom(roomId);
            if (!room) return;

            room.state.playbackState = 'paused';
            room.state.baseTimestamp = timestamp; // Save where we paused
            room.state.lastSyncTime = Date.now();

            io.to(roomId).emit('sync-update', {
                playbackState: 'paused',
                baseTimestamp: room.state.baseTimestamp,
                lastSyncTime: room.state.lastSyncTime
            });
        });

        socket.on('intent:seek', ({ roomId, timestamp }) => {
            const room = roomManager.getRoom(roomId);
            if (!room) return;

            room.state.baseTimestamp = timestamp;
            // If playing, we might need to resync start time?
            // Usually seek implies "play/continue from here".
            // Let's assume seek keeps current playback state but updates timestamp.
            
            if (room.state.playbackState === 'playing') {
                const NOW = Date.now();
                const BUFFER = 500;
                room.state.lastSyncTime = NOW + BUFFER;
                
                 io.to(roomId).emit('sync-update', {
                    playbackState: 'playing',
                    baseTimestamp: room.state.baseTimestamp,
                    playAt: room.state.lastSyncTime,
                    isSeek: true
                });
            } else {
                io.to(roomId).emit('sync-update', {
                    playbackState: 'paused',
                    baseTimestamp: room.state.baseTimestamp,
                    lastSyncTime: Date.now(),
                    isSeek: true
                });
            }
        });

        // --- Playlist Management ---
        socket.on('intent:add-song', async ({ roomId, song }) => {
            const room = roomManager.getRoom(roomId);
            if (!room) return;

            // Check if song already in playlist
            if (room.state.playlist.some(s => s.id === song.id)) return;

            // Add to playlist
            room.state.playlist.push(song);

            // Update preferences
            if (song.genre) {
                room.state.roomPreferences.genreScores[song.genre] = (room.state.roomPreferences.genreScores[song.genre] || 0) + 2;
            }

            // If nothing playing, start this song?
            if (!room.state.currentSong) {
                // Determine logic: autoplay if empty?
                // For now, just add. User must click play?
                // Better: if no current song, make this current song (paused).
                 room.state.currentSong = song;
                 // Remove from playlist (since it's now current)?
                 // Or keep current separate from playlist queue.
                 // Let's keep separate: currentSong vs playlist (queue).
                 room.state.playlist = room.state.playlist.filter(s => s.id !== song.id);
                 
                 io.to(roomId).emit('room-state', room);
            } else {
                 io.to(roomId).emit('playlist-update', room.state.playlist);
            }
        });

        socket.on('intent:skip', async ({ roomId }) => {
            const room = roomManager.getRoom(roomId);
            if (!room) return;

            // Logic to move next song from playlist to current
            await playNextSong(room, roomId);
        });

        socket.on('intent:song-ended', async ({ roomId }) => {
             const room = roomManager.getRoom(roomId);
            if (!room) return;
            
            // Logic similar to skip, but maybe different scoring
            await playNextSong(room, roomId);
        });

        // --- Helper: Play Next ---
        async function playNextSong(room, roomId) {
            if (room.state.playlist.length > 0) {
                const nextSong = room.state.playlist.shift();
                room.state.currentSong = nextSong;
                room.state.playbackState = 'playing'; // Auto-play next
                room.state.baseTimestamp = 0;
                
                const NOW = Date.now();
                const BUFFER = 500;
                room.state.lastSyncTime = NOW + BUFFER;

                 io.to(roomId).emit('room-state', room); // Full update since currentSong changed
                 
                 // Check recommendations if playlist low
                 if (room.state.playlist.length < 3) {
                     const recs = await recommendationEngine.getRecommendations(room);
                     io.to(roomId).emit('recommendations', recs);
                 }
            } else {
                // Playlist empty
                room.state.currentSong = null;
                room.state.playbackState = 'paused';
                io.to(roomId).emit('room-state', room); // Stop
                
                // Fetch recommendations/auto-add?
                // "Automatically play recommended songs when playlist becomes empty"
                 const recs = await recommendationEngine.getRecommendations(room);
                 if (recs.length > 0) {
                     // Check auto-add rule
                     // Let's auto-add 1 recommendation
                     const autoIdx = 0;
                     const autoSong = recs[autoIdx];
                     room.state.currentSong = autoSong;
                     room.state.playbackState = 'playing';
                     room.state.baseTimestamp = 0;
                     room.state.lastSyncTime = Date.now() + 500;
                     io.to(roomId).emit('room-state', room);
                     
                     // Send remaining recs
                     io.to(roomId).emit('recommendations', recs.slice(1));
                 }
            }
        }

        // --- Disconnect ---
        socket.on('disconnect', () => {
             console.log('User disconnected:', socket.id);
             roomManager.removeUserFromAllRooms(socket.id);
        });
    });
};
