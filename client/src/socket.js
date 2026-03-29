const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const STUN_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

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

class WebRTCRoomSocket {
  constructor() {
    this.id = null;
    this.roomId = null;
    this.roomState = null;
    this.hostPeerId = null;
    this.isHost = false;
    this.connections = new Map();
    this.pendingCandidates = new Map();
    this.handlers = new Map();
    this.pollers = {};
    this.connected = false;
  }

  on(event, handler) {
    const handlers = this.handlers.get(event) || new Set();
    handlers.add(handler);
    this.handlers.set(event, handlers);
  }

  off(event, handler) {
    const handlers = this.handlers.get(event);
    if (!handlers) {
      return;
    }
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.handlers.delete(event);
    }
  }

  emitLocal(event, payload) {
    const handlers = this.handlers.get(event);
    if (!handlers) {
      return;
    }
    handlers.forEach((handler) => handler(payload));
  }

  connect() {
    if (!this.id) {
      this.id = crypto.randomUUID();
    }

    if (this.connected) {
      return;
    }

    this.connected = true;
    this.emitLocal("connect");
  }

  disconnect() {
    if (!this.connected) {
      return;
    }

    this.connected = false;
    this.stopPolling();
    this.closeAllConnections();

    if (this.roomId) {
      this.leaveRoom();
    }
  }

  emit(event, payload) {
    switch (event) {
      case "create-room":
        this.createRoom();
        break;
      case "join-room":
        this.joinRoom(payload);
        break;
      case "intent:play":
      case "intent:pause":
      case "intent:seek":
      case "intent:add-song":
      case "intent:play-now":
      case "intent:skip":
      case "intent:song-ended":
      case "intent:remove-song":
        this.dispatchIntent(event, payload || {});
        break;
      default:
        this.emitLocal("error", { message: `Unsupported event: ${event}` });
    }
  }

  async createRoom() {
    try {
      this.ensureConnected();
      const response = await fetch(`${BACKEND_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: this.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const room = await response.json();
      this.applyRoomSnapshot(room);
      this.startPolling();
      this.emitLocal("room-joined", room);
    } catch (error) {
      this.emitLocal("error", { message: error.message });
    }
  }

  async joinRoom(roomId) {
    try {
      this.ensureConnected();
      const response = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: this.id }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Room not found");
        }
        throw new Error("Failed to join room");
      }

      const room = await response.json();
      this.applyRoomSnapshot(room);
      this.startPolling();
      this.emitLocal("room-joined", room);

      if (!this.isHost && this.hostPeerId) {
        this.connectToHost(this.hostPeerId);
      }
    } catch (error) {
      this.emitLocal("error", { message: error.message });
    }
  }

  async leaveRoom() {
    const roomId = this.roomId;
    if (!roomId || !this.id) {
      return;
    }

    try {
      await fetch(`${BACKEND_URL}/api/rooms/${roomId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: this.id }),
        keepalive: true,
      });
    } catch (error) {
      console.error("Failed to leave room:", error);
    } finally {
      this.roomId = null;
      this.hostPeerId = null;
      this.isHost = false;
      this.roomState = null;
    }
  }

  ensureConnected() {
    if (!this.connected) {
      this.connect();
    }
  }

  applyRoomSnapshot(room) {
    this.roomId = room.roomId;
    this.hostPeerId = room.hostPeerId;
    this.isHost = room.hostPeerId === this.id;
    this.roomState = room.state || createDefaultState();
  }

  startPolling() {
    this.stopPolling();

    this.pollers.signals = window.setInterval(() => {
      this.pollSignals();
    }, 1000);

    this.pollers.room = window.setInterval(() => {
      this.pollRoom();
    }, 2500);

    this.pollers.heartbeat = window.setInterval(() => {
      this.sendHeartbeat();
    }, 5000);
  }

  stopPolling() {
    Object.values(this.pollers).forEach((poller) => {
      window.clearInterval(poller);
    });
    this.pollers = {};
  }

  async sendHeartbeat() {
    if (!this.roomId || !this.id) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/rooms/${this.roomId}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: this.id }),
      });

      if (response.ok) {
        const room = await response.json();
        this.handleHostChange(room);
      }
    } catch (error) {
      console.error("Heartbeat failed:", error);
    }
  }

  async pollRoom() {
    if (!this.roomId || !this.id) {
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/rooms/${this.roomId}?peerId=${encodeURIComponent(this.id)}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          this.emitLocal("error", { message: "Room closed" });
        }
        return;
      }

      const room = await response.json();
      this.handleHostChange(room);

      if (
        !this.isHost &&
        this.hostPeerId &&
        this.connections.get(this.hostPeerId)?.channel?.readyState !== "open"
      ) {
        this.connectToHost(this.hostPeerId);
      }
    } catch (error) {
      console.error("Room poll failed:", error);
    }
  }

  handleHostChange(room) {
    const previousHostPeerId = this.hostPeerId;
    this.applyRoomSnapshot(room);

    if (this.isHost) {
      if (previousHostPeerId && previousHostPeerId !== this.id) {
        this.closeConnection(previousHostPeerId);
      }
      return;
    }

    if (previousHostPeerId && previousHostPeerId !== room.hostPeerId) {
      this.closeConnection(previousHostPeerId);
    }

    if (room.hostPeerId && room.hostPeerId !== this.id) {
      this.connectToHost(room.hostPeerId);
    }
  }

  async pollSignals() {
    if (!this.roomId || !this.id) {
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/rooms/${this.roomId}/signals?peerId=${encodeURIComponent(this.id)}`,
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      for (const queuedSignal of data.signals || []) {
        await this.handleSignal(queuedSignal);
      }
    } catch (error) {
      console.error("Signal poll failed:", error);
    }
  }

  async handleSignal({ fromPeerId, signal }) {
    if (!signal) {
      return;
    }

    if (signal.type === "offer") {
      const connection = this.ensurePeerConnection(fromPeerId, false);
      await connection.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      await this.flushPendingCandidates(fromPeerId);
      const answer = await connection.pc.createAnswer();
      await connection.pc.setLocalDescription(answer);
      await this.postSignal(fromPeerId, {
        type: "answer",
        sdp: answer,
      });
      return;
    }

    const connection = this.connections.get(fromPeerId);
    if (!connection) {
      return;
    }

    if (signal.type === "answer" && signal.sdp) {
      await connection.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      await this.flushPendingCandidates(fromPeerId);
      return;
    }

    if (signal.type === "ice-candidate" && signal.candidate) {
      const queuedCandidates = this.pendingCandidates.get(fromPeerId) || [];
      queuedCandidates.push(signal.candidate);
      this.pendingCandidates.set(fromPeerId, queuedCandidates);

      try {
        await this.flushPendingCandidates(fromPeerId);
      } catch (error) {
        console.error("Failed to add ICE candidate:", error);
      }
    }
  }

  async postSignal(toPeerId, signal) {
    if (!this.roomId) {
      return;
    }

    await fetch(`${BACKEND_URL}/api/rooms/${this.roomId}/signals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromPeerId: this.id,
        toPeerId,
        signal,
      }),
    });
  }

  connectToHost(hostPeerId) {
    if (!hostPeerId || hostPeerId === this.id) {
      return;
    }

    const existingConnection = this.connections.get(hostPeerId);
    if (existingConnection?.pc?.connectionState === "connected" || existingConnection?.makingOffer) {
      return;
    }

    this.ensurePeerConnection(hostPeerId, true);
  }

  ensurePeerConnection(remotePeerId, initiator) {
    let connection = this.connections.get(remotePeerId);
    if (connection) {
      return connection;
    }

    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    connection = {
      pc,
      channel: null,
      makingOffer: false,
    };

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.postSignal(remotePeerId, {
          type: "ice-candidate",
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        if (!this.isHost && remotePeerId === this.hostPeerId) {
          this.closeConnection(remotePeerId);
        }
      }
    };

    pc.ondatachannel = (event) => {
      this.attachDataChannel(remotePeerId, event.channel);
    };

    this.connections.set(remotePeerId, connection);

    if (initiator) {
      const channel = pc.createDataChannel("room");
      this.attachDataChannel(remotePeerId, channel);
      connection.makingOffer = true;
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() =>
          this.postSignal(remotePeerId, {
            type: "offer",
            sdp: pc.localDescription,
          }),
        )
        .catch((error) => console.error("Failed to create offer:", error))
        .finally(() => {
          connection.makingOffer = false;
        });
    }

    return connection;
  }

  attachDataChannel(remotePeerId, channel) {
    const connection = this.connections.get(remotePeerId);
    if (!connection) {
      return;
    }

    connection.channel = channel;
    channel.onopen = () => {
      if (this.isHost) {
        this.sendMessage(remotePeerId, {
          type: "room-state",
          room: {
            roomId: this.roomId,
            state: this.cloneState(),
          },
        });
      }
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleDataMessage(remotePeerId, message);
      } catch (error) {
        console.error("Failed to parse data channel message:", error);
      }
    };

    channel.onclose = () => {
      if (!this.isHost && remotePeerId === this.hostPeerId) {
        this.closeConnection(remotePeerId);
      }
    };
  }

  handleDataMessage(remotePeerId, message) {
    if (message.type === "intent") {
      if (this.isHost) {
        this.applyIntent(message.intent, message.payload || {}, remotePeerId);
      }
      return;
    }

    if (message.type === "room-state" && message.room) {
      this.roomState = message.room.state;
      this.emitLocal("room-state", message.room);
      return;
    }

    if (message.type === "playlist-update") {
      this.emitLocal("playlist-update", message.playlist || []);
      return;
    }

    if (message.type === "sync-update") {
      this.emitLocal("sync-update", message.payload || {});
    }
  }

  dispatchIntent(intent, payload) {
    if (!this.roomId) {
      this.emitLocal("error", { message: "Join a room first" });
      return;
    }

    if (this.isHost) {
      this.applyIntent(intent, payload, this.id);
      return;
    }

    const connection = this.connections.get(this.hostPeerId);
    if (!connection?.channel || connection.channel.readyState !== "open") {
      this.emitLocal("error", { message: "Host connection not ready yet" });
      return;
    }

    connection.channel.send(
      JSON.stringify({
        type: "intent",
        intent,
        payload,
      }),
    );
  }

  async applyIntent(intent, payload, sourcePeerId) {
    if (!this.roomState) {
      this.roomState = createDefaultState();
    }

    switch (intent) {
      case "intent:play": {
        const now = Date.now();
        this.roomState.playbackState = "playing";
        this.roomState.baseTimestamp = payload.timestamp || 0;
        this.roomState.lastSyncTime = now + 500;
        this.broadcastSync({
          playbackState: "playing",
          baseTimestamp: this.roomState.baseTimestamp,
          playAt: this.roomState.lastSyncTime,
          lastSyncTime: this.roomState.lastSyncTime,
        });
        break;
      }
      case "intent:pause": {
        this.roomState.playbackState = "paused";
        this.roomState.baseTimestamp = payload.timestamp || 0;
        this.roomState.lastSyncTime = Date.now();
        this.broadcastSync({
          playbackState: "paused",
          baseTimestamp: this.roomState.baseTimestamp,
          lastSyncTime: this.roomState.lastSyncTime,
        });
        break;
      }
      case "intent:seek": {
        this.roomState.baseTimestamp = payload.timestamp || 0;
        if (this.roomState.playbackState === "playing") {
          this.roomState.lastSyncTime = Date.now() + 500;
          this.broadcastSync({
            playbackState: "playing",
            baseTimestamp: this.roomState.baseTimestamp,
            playAt: this.roomState.lastSyncTime,
            lastSyncTime: this.roomState.lastSyncTime,
            isSeek: true,
          });
        } else {
          this.roomState.lastSyncTime = Date.now();
          this.broadcastSync({
            playbackState: "paused",
            baseTimestamp: this.roomState.baseTimestamp,
            lastSyncTime: this.roomState.lastSyncTime,
            isSeek: true,
          });
        }
        break;
      }
      case "intent:add-song": {
        const song = payload.song;
        if (!song || this.roomState.playlist.some((queuedSong) => queuedSong.id === song.id)) {
          return;
        }

        if (song.genre) {
          this.roomState.roomPreferences.genreScores[song.genre] =
            (this.roomState.roomPreferences.genreScores[song.genre] || 0) + 2;
        }

        if (!this.roomState.currentSong) {
          this.roomState.currentSong = song;
          this.roomState.playbackState = "playing";
          this.roomState.baseTimestamp = 0;
          this.roomState.lastSyncTime = Date.now() + 500;
          this.broadcastRoomState();
        } else {
          this.roomState.playlist.push(song);
          this.broadcastPlaylist();
        }
        break;
      }
      case "intent:play-now": {
        const song = payload.song;
        if (!song) {
          return;
        }

        if (this.roomState.currentSong) {
          this.roomState.playlist.unshift(this.roomState.currentSong);
        }

        this.roomState.currentSong = song;
        this.roomState.playbackState = "playing";
        this.roomState.baseTimestamp = 0;
        this.roomState.lastSyncTime = Date.now() + 500;
        this.broadcastRoomState();
        break;
      }
      case "intent:skip":
        await this.playNextSong(payload.direction || "next");
        break;
      case "intent:song-ended":
        await this.playNextSong("next");
        break;
      case "intent:remove-song":
        this.roomState.playlist = this.roomState.playlist.filter((song) => song.id !== payload.songId);
        this.broadcastPlaylist();
        break;
      default:
        console.warn("Unhandled intent:", intent, payload, sourcePeerId);
        return;
    }

    this.pushRoomStateToServer();
  }

  async playNextSong(direction = "next") {
    if (direction === "previous") {
      if (this.roomState.playHistory.length > 0) {
        if (this.roomState.currentSong) {
          this.roomState.playlist.unshift(this.roomState.currentSong);
        }

        this.roomState.currentSong = this.roomState.playHistory.pop();
        this.roomState.playbackState = "playing";
        this.roomState.baseTimestamp = 0;
        this.roomState.lastSyncTime = Date.now() + 500;
        this.broadcastRoomState();
        return;
      }

      if (this.roomState.currentSong) {
        this.roomState.playbackState = "playing";
        this.roomState.baseTimestamp = 0;
        this.roomState.lastSyncTime = Date.now() + 500;
        this.broadcastSync({
          playbackState: "playing",
          baseTimestamp: 0,
          playAt: this.roomState.lastSyncTime,
          lastSyncTime: this.roomState.lastSyncTime,
        });
      }
      return;
    }

    if (this.roomState.currentSong) {
      this.roomState.playHistory.push(this.roomState.currentSong);
    }

    if (this.roomState.playlist.length > 0) {
      this.roomState.currentSong = this.roomState.playlist.shift();
      this.roomState.playbackState = "playing";
      this.roomState.baseTimestamp = 0;
      this.roomState.lastSyncTime = Date.now() + 500;
      this.broadcastRoomState();
      return;
    }

    const randomSong = await this.getRandomSong();
    if (randomSong) {
      this.roomState.currentSong = randomSong;
      this.roomState.playbackState = "playing";
      this.roomState.baseTimestamp = 0;
      this.roomState.lastSyncTime = Date.now() + 500;
      this.broadcastRoomState();
      return;
    }

    this.roomState.currentSong = null;
    this.roomState.playbackState = "paused";
    this.broadcastRoomState();
  }

  async getRandomSong() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/firestore-songs`);
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const songs = Array.isArray(data) ? data : data.songs || [];
      if (songs.length === 0) {
        return null;
      }

      const randomSong = songs[Math.floor(Math.random() * songs.length)];
      return {
        id: randomSong.id,
        title: randomSong.title || "Unknown Title",
        artist: randomSong.artist || "Unknown Artist",
        album: randomSong.album || "Unknown Album",
        genre: randomSong.genre || "",
        albumArt: randomSong.albumArt,
        duration: randomSong.duration || 0,
        streamUrl: randomSong.cloudinaryUrl || randomSong.streamUrl,
      };
    } catch (error) {
      console.error("Failed to fetch random song:", error);
      return null;
    }
  }

  broadcastRoomState() {
    const room = {
      roomId: this.roomId,
      state: this.cloneState(),
    };

    this.emitLocal("room-state", room);
    this.broadcast({
      type: "room-state",
      room,
    });
  }

  broadcastPlaylist() {
    const playlist = [...this.roomState.playlist];
    this.emitLocal("playlist-update", playlist);
    this.broadcast({
      type: "playlist-update",
      playlist,
    });
  }

  broadcastSync(payload) {
    this.emitLocal("sync-update", payload);
    this.broadcast({
      type: "sync-update",
      payload,
    });
  }

  broadcast(message) {
    for (const [peerId, connection] of this.connections.entries()) {
      if (connection.channel?.readyState === "open") {
        connection.channel.send(JSON.stringify(message));
      }
    }
  }

  sendMessage(peerId, message) {
    const connection = this.connections.get(peerId);
    if (connection?.channel?.readyState === "open") {
      connection.channel.send(JSON.stringify(message));
    }
  }

  async pushRoomStateToServer() {
    if (!this.roomId || !this.isHost) {
      return;
    }

    try {
      await fetch(`${BACKEND_URL}/api/rooms/${this.roomId}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peerId: this.id,
          state: this.cloneState(),
        }),
      });
    } catch (error) {
      console.error("Failed to persist room state:", error);
    }
  }

  cloneState() {
    return JSON.parse(JSON.stringify(this.roomState || createDefaultState()));
  }

  async flushPendingCandidates(peerId) {
    const connection = this.connections.get(peerId);
    const queuedCandidates = this.pendingCandidates.get(peerId);
    if (!connection?.pc || !queuedCandidates?.length || !connection.pc.remoteDescription) {
      return;
    }

    while (queuedCandidates.length > 0) {
      const candidate = queuedCandidates.shift();
      await connection.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }

    this.pendingCandidates.delete(peerId);
  }

  closeConnection(peerId) {
    const connection = this.connections.get(peerId);
    if (!connection) {
      return;
    }

    connection.channel?.close();
    connection.pc?.close();
    this.connections.delete(peerId);
    this.pendingCandidates.delete(peerId);
  }

  closeAllConnections() {
    [...this.connections.keys()].forEach((peerId) => this.closeConnection(peerId));
  }
}

export const socket = new WebRTCRoomSocket();
