const roomManager = require("../services/roomManager");

const getRoomOr404 = (roomId, res) => {
  const room = roomManager.getRoom(roomId);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return null;
  }
  return room;
};

exports.createRoom = (req, res) => {
  const { peerId } = req.body || {};
  if (!peerId) {
    return res.status(400).json({ error: "peerId is required" });
  }

  const room = roomManager.createRoom(peerId);
  return res.status(201).json(roomManager.serializeRoom(room));
};

exports.joinRoom = (req, res) => {
  const { peerId } = req.body || {};
  if (!peerId) {
    return res.status(400).json({ error: "peerId is required" });
  }

  const room = roomManager.joinRoom(req.params.roomId, peerId);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  return res.json(roomManager.serializeRoom(room));
};

exports.leaveRoom = (req, res) => {
  const { peerId } = req.body || {};
  if (!peerId) {
    return res.status(400).json({ error: "peerId is required" });
  }

  roomManager.leaveRoom(req.params.roomId, peerId);
  return res.status(204).send();
};

exports.getRoom = (req, res) => {
  const room = getRoomOr404(req.params.roomId, res);
  if (!room) {
    return;
  }

  const { peerId } = req.query;
  if (peerId) {
    roomManager.heartbeat(req.params.roomId, peerId);
  }

  return res.json(roomManager.serializeRoom(room));
};

exports.heartbeat = (req, res) => {
  const { peerId } = req.body || {};
  if (!peerId) {
    return res.status(400).json({ error: "peerId is required" });
  }

  const room = roomManager.heartbeat(req.params.roomId, peerId);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  return res.json(roomManager.serializeRoom(room));
};

exports.updateRoomState = (req, res) => {
  const { peerId, state } = req.body || {};
  if (!peerId || !state) {
    return res.status(400).json({ error: "peerId and state are required" });
  }

  const room = roomManager.updateState(req.params.roomId, state, peerId);
  if (!room) {
    return res.status(403).json({ error: "Only the current host can update room state" });
  }

  return res.json(roomManager.serializeRoom(room));
};

exports.postSignal = (req, res) => {
  const { fromPeerId, toPeerId, signal } = req.body || {};
  if (!fromPeerId || !toPeerId || !signal) {
    return res.status(400).json({ error: "fromPeerId, toPeerId, and signal are required" });
  }

  const queued = roomManager.queueSignal(req.params.roomId, {
    fromPeerId,
    toPeerId,
    signal,
  });

  if (queued === null) {
    return res.status(404).json({ error: "Room or target peer not found" });
  }

  return res.status(202).json({ queued });
};

exports.getSignals = (req, res) => {
  const { peerId } = req.query;
  if (!peerId) {
    return res.status(400).json({ error: "peerId is required" });
  }

  const signals = roomManager.drainSignals(req.params.roomId, peerId);
  if (signals === null) {
    return res.status(404).json({ error: "Room not found" });
  }

  return res.json({ signals });
};
