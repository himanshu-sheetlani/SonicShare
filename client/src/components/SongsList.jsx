import { useState, useEffect } from 'react';
import { Music, Loader, AlertCircle } from 'lucide-react';
import { socket } from '../socket';
import { useStore } from '../store';

export function SongsList() {
  const { roomId } = useStore();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/firestore-songs`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch songs');
      }
      
      const data = await response.json();
      setSongs(Array.isArray(data) ? data : data.songs || []);
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addSongToPlaylist = (song) => {
    const songData = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      streamUrl: song.cloudinaryUrl || song.streamUrl,
      duration: song.duration || 0,
      albumArt: song.albumArt,
    };
    
    socket.emit('intent:add-song', { roomId, song: songData });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
        <p className="text-red-400 text-sm">{error}</p>
        <button 
          onClick={fetchSongs}
          className="mt-3 px-3 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-white">Available Songs</h3>
          <span className="px-2.5 py-0.5 rounded-full bg-neutral-700 text-xs font-medium text-neutral-300 border border-neutral-600">
            {songs.length}
          </span>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {songs.length > 0 ? (
          songs.map((song, idx) => (
            <div
              key={song.id}
              className="flex items-center gap-4 p-3 hover:bg-neutral-700/50 rounded-xl transition-all group border border-transparent hover:border-neutral-600/50 cursor-pointer"
              onClick={() => addSongToPlaylist(song)}
            >
              <span className="text-neutral-500 text-sm w-6 text-center font-mono font-medium group-hover:text-indigo-400">
                {idx + 1}
              </span>

              {/* Album Art / Song Icon */}
              <div className="w-10 h-10 rounded bg-gradient-to-br from-indigo-600 to-purple-600 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {song.albumArt ? (
                  <img 
                    src={song.albumArt} 
                    alt={song.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Music size={20} className="text-white/80" />
                )}
              </div>

              <div className="flex-grow min-w-0">
                <p className="font-semibold truncate text-neutral-200 text-base">{song.title}</p>
                <p className="text-sm text-neutral-400 truncate">{song.artist}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addSongToPlaylist(song);
                }}
                className="opacity-0 group-hover:opacity-100 px-3 py-1 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-all"
              >
                Add
              </button>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 opacity-60">
            <Music size={32} className="mb-2" />
            <p className="text-lg font-medium">No songs available</p>
            <p className="text-sm">Upload songs from the admin panel</p>
          </div>
        )}
      </div>
    </div>
  );
}
