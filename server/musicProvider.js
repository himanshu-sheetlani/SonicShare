class MusicProvider {
    async search(query) {
        throw new Error("Method 'search' must be implemented.");
    }

    async getRecommendations(seeds) {
        throw new Error("Method 'getRecommendations' must be implemented.");
    }
}

class MockMusicProvider extends MusicProvider {
    constructor() {
        super();
        this.mockDatabase = [
            { id: '1', title: 'Bohemian Rhapsody', artist: 'Queen', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', genre: 'Rock' },
            { id: '2', title: 'Hotel California', artist: 'Eagles', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', genre: 'Rock' },
            { id: '3', title: 'Start Me Up', artist: 'The Rolling Stones', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', genre: 'Rock' },
            { id: '4', title: 'Take Five', artist: 'Dave Brubeck', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', genre: 'Jazz' },
            { id: '5', title: 'So What', artist: 'Miles Davis', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', genre: 'Jazz' },
            { id: '6', title: 'Billie Jean', artist: 'Michael Jackson', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', genre: 'Pop' },
            { id: '7', title: 'Thriller', artist: 'Michael Jackson', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', genre: 'Pop' },
            { id: '8', title: 'Rolling in the Deep', artist: 'Adele', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', genre: 'Pop' },
            { id: '9', title: 'Smells Like Teen Spirit', artist: 'Nirvana', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', genre: 'Grunge' },
            { id: '10', title: 'Wonderwall', artist: 'Oasis', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', genre: 'Rock' }
        ];
    }

    async search(query) {
        const lowerQuery = query.toLowerCase();
        return this.mockDatabase.filter(song => 
            song.title.toLowerCase().includes(lowerQuery) || 
            song.artist.toLowerCase().includes(lowerQuery)
        );
    }

    async getRecommendations(preferences) {
        // Simple recommendation logic: Top genre or random
        let topGenre = null;
        let maxScore = -Infinity;
        
        if (preferences && preferences.genreScores) {
            for (const [genre, score] of Object.entries(preferences.genreScores)) {
                if (score > maxScore) {
                    maxScore = score;
                    topGenre = genre;
                }
            }
        }

        if (topGenre) {
             return this.mockDatabase.filter(song => song.genre === topGenre);
        }
        
        // Return random 3 songs
        return this.mockDatabase.sort(() => 0.5 - Math.random()).slice(0, 3);
    }
}

module.exports = { MockMusicProvider };
