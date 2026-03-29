import { useState, useEffect } from 'react';
import { Music, Loader, AlertCircle, Play } from 'lucide-react';
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

  const playNow = (song) => {
    const songData = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      streamUrl: song.cloudinaryUrl || song.streamUrl,
      duration: song.duration || 0,
      albumArt: song.albumArt,
    };
    
    socket.emit('intent:play-now', { roomId, song: songData });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="w-6 h-6 text-[#56e084] animate-spin" />
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
          className="mt-3 px-3 py-1 text-xs rounded-lg border border-white/10 bg-white/6 hover:bg-white/10 text-white transition-colors"
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
          <span className="px-2.5 py-0.5 rounded-full bg-white/6 text-xs font-medium text-white/75 border border-white/10">
            {songs.length}
          </span>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {songs.length > 0 ? (
          songs.map((song, idx) => (
            <div
              key={song.id}
              className="flex items-center gap-4 p-3 hover:bg-white/6 rounded-xl transition-all group border border-transparent hover:border-white/10 cursor-pointer"
              onClick={() => addSongToPlaylist(song)}
            >
              {/* Play Button - Hidden by default, shown on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playNow(song);
                }}
                className="hidden group-hover:block w-6 h-6 flex items-center justify-center text-[#56e084] hover:text-[#8ff0ab] transition-colors flex-shrink-0"
                title="Play Now"
              >
                <Play size={18} fill="currentColor" />
              </button>

              {/* Number - Shown by default, hidden on hover */}
              <span className="group-hover:hidden text-white/40 text-sm w-6 text-center font-mono font-medium">
                {idx + 1}
              </span>

              {/* Album Art / Song Icon */}
              <div className="w-10 h-10 rounded bg-gradient-to-br from-[#12335f] to-[#34d266] overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10">
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
                <p className="font-semibold truncate text-white text-base">{song.title}</p>
                <p className="text-sm text-white/55 truncate">{song.artist}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/40 opacity-80">
            <Music size={32} className="mb-2" />
            <p className="text-lg font-medium">No songs available</p>
            <p className="text-sm">Upload songs from the admin panel</p>
          </div>
        )}
      </div>
    </div>
  );
}
