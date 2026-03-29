const { v4: uuidv4 } = require("uuid");

const STALE_MEMBER_MS = 30000;
const EMPTY_ROOM_GRACE_MS = 30000;

const createDefaultState = () => ({
  currentSong: null,
  playbackState: "paused",
  baseTimestamp: 0,
  lastSyncTime: Date.now(),
  playlist: [],
  playHistory: [],
  roomPreferences: {
    genreScores: {},
    artistScores: {},
  },
});

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  createRoom(hostPeerId) {
    const roomId = uuidv4().slice(0, 6);
    const now = Date.now();
    const room = {
      roomId,
      hostPeerId: hostPeerId || null,
      state: createDefaultState(),
      members: new Map(),
      signals: new Map(),
      createdAt: now,
      updatedAt: now,
    };

    if (hostPeerId) {
      room.members.set(hostPeerId, {
        joinedAt: now,
        lastSeenAt: now,
      });
      room.signals.set(hostPeerId, []);
    }

    this.rooms.set(roomId, room);

    return room;
  }

  getRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    this.cleanupStaleMembers(room);
    if (!this.rooms.has(roomId)) {
      return null;
    }

    return room;
  }

  joinRoom(roomId, peerId) {
    const room = this.getRoom(roomId);
    if (!room) {
      return null;
    }

    const now = Date.now();
    const existingMember = room.members.get(peerId);
    room.members.set(peerId, {
      joinedAt: existingMember?.joinedAt || now,
      lastSeenAt: now,
    });

    if (!room.hostPeerId) {
      room.hostPeerId = peerId;
    }

    if (!room.signals.has(peerId)) {
      room.signals.set(peerId, []);
    }

    room.updatedAt = now;
    return room;
  }

  heartbeat(roomId, peerId) {
    const room = this.getRoom(roomId);
    if (!room) {
      return null;
    }

    const member = room.members.get(peerId);
    if (!member) {
      return null;
    }

    member.lastSeenAt = Date.now();
    room.updatedAt = Date.now();
    return room;
  }

  leaveRoom(roomId, peerId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    room.members.delete(peerId);
    room.signals.delete(peerId);

    for (const queuedSignals of room.signals.values()) {
      for (let i = queuedSignals.length - 1; i >= 0; i -= 1) {
        if (queuedSignals[i].fromPeerId === peerId || queuedSignals[i].toPeerId === peerId) {
          queuedSignals.splice(i, 1);
        }
      }
    }

    this.ensureHost(room);
    room.updatedAt = Date.now();

    if (room.members.size === 0) {
      setTimeout(() => {
        const latestRoom = this.rooms.get(roomId);
        if (latestRoom && latestRoom.members.size === 0) {
          this.rooms.delete(roomId);
          console.log(`Room ${roomId} deleted due to inactivity.`);
        }
      }, EMPTY_ROOM_GRACE_MS);
    }

    return true;
  }

  updateState(roomId, nextState, peerId) {
    const room = this.getRoom(roomId);
    if (!room) {
      return null;
    }

    if (room.hostPeerId && room.hostPeerId !== peerId) {
      return null;
    }

    room.state = this.clone(nextState);
    room.updatedAt = Date.now();
    return room;
  }

  queueSignal(roomId, { fromPeerId, toPeerId, signal }) {
    const room = this.getRoom(roomId);
    if (!room) {
      return null;
    }

    if (!room.members.has(fromPeerId) || !room.members.has(toPeerId)) {
      return null;
    }

    const queue = room.signals.get(toPeerId) || [];
    queue.push({
      id: uuidv4(),
      fromPeerId,
      toPeerId,
      signal,
      createdAt: Date.now(),
    });
    room.signals.set(toPeerId, queue);
    room.updatedAt = Date.now();
    return queue.length;
  }

  drainSignals(roomId, peerId) {
    const room = this.getRoom(roomId);
    if (!room) {
      return null;
    }

    const queuedSignals = room.signals.get(peerId) || [];
    room.signals.set(peerId, []);
    room.updatedAt = Date.now();
    return queuedSignals;
  }

  serializeRoom(room) {
    return {
      roomId: room.roomId,
      hostPeerId: room.hostPeerId,
      members: [...room.members.keys()],
      state: this.clone(room.state),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  cleanupStaleMembers(room) {
    const now = Date.now();
    const stalePeerIds = [];

    for (const [peerId, member] of room.members.entries()) {
      if (now - member.lastSeenAt > STALE_MEMBER_MS) {
        stalePeerIds.push(peerId);
      }
    }

    stalePeerIds.forEach((peerId) => {
      room.members.delete(peerId);
      room.signals.delete(peerId);
    });

    if (stalePeerIds.length > 0) {
      this.ensureHost(room);
    }

    if (room.members.size === 0) {
      this.rooms.delete(room.roomId);
    }
  }

  ensureHost(room) {
    if (room.hostPeerId && room.members.has(room.hostPeerId)) {
      return;
    }

    const nextHostEntry = [...room.members.entries()].sort(
      (a, b) => a[1].joinedAt - b[1].joinedAt,
    )[0];

    room.hostPeerId = nextHostEntry ? nextHostEntry[0] : null;
  }
}

module.exports = new RoomManager();
