const { v4: uuidv4 } = require('uuid');

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom() {
        const roomId = uuidv4().slice(0, 8); // Short ID for easier sharing
        const room = {
            roomId,
            state: {
                currentSong: null,
                playbackState: 'paused',
                baseTimestamp: 0,
                lastSyncTime: Date.now(),
                playlist: [],
                roomPreferences: {
                    genreScores: {},
                    artistScores: {}
                }
            },
            users: new Set(), // Set of socketIds
            createdAt: Date.now()
        };
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    joinRoom(roomId, socketId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.users.add(socketId);
            return room;
        }
        return null;
    }

    leaveRoom(roomId, socketId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.users.delete(socketId);
            if (room.users.size === 0) {
                // Determine if we should delete immediately or wait
                // For now, simple implementation: delete if empty
                setTimeout(() => {
                    if (this.rooms.get(roomId)?.users.size === 0) {
                        this.rooms.delete(roomId);
                        console.log(`Room ${roomId} deleted due to inactivity.`);
                    }
                }, 30000); // 30 seconds grace period
            }
            return true;
        }
        return false;
    }

    // Helper to cleanup user from all rooms (on disconnect)
    removeUserFromAllRooms(socketId) {
        for (const [roomId, room] of this.rooms) {
            if (room.users.has(socketId)) {
                this.leaveRoom(roomId, socketId);
            }
        }
    }
}

module.exports = new RoomManager();
