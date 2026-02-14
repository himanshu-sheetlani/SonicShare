const { MockMusicProvider } = require('./musicProvider');

class RecommendationEngine {
    constructor() {
        this.provider = new MockMusicProvider();
    }

    async getRecommendations(room) {
        // Collect played song IDs to exclude
        // In a real app, track history array. Here we can use playlist + currentSong
        const playedIds = new Set();
        if (room.state.currentSong) playedIds.add(room.state.currentSong.id);
        room.state.playlist.forEach(song => playedIds.add(song.id));

        const recommendations = await this.provider.getRecommendations(room.state.roomPreferences);
        
        // Filter out played/queued songs
        const filtered = recommendations.filter(song => !playedIds.has(song.id));
        
        // Return top 3
        return filtered.slice(0, 3);
    }
}

module.exports = new RecommendationEngine();
