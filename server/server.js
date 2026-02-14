const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const socketHandler = require('./socketHandler');
const { MockMusicProvider } = require('./musicProvider');

const app = express();
app.use(cors());
app.use(express.json());

const musicProvider = new MockMusicProvider();

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        const results = await musicProvider.search(q);
        res.json(results);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Initialize socket logic
socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
