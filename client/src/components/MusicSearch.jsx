import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { socket } from '../socket';
import { useStore } from '../store';

export function MusicSearch() {
  const { roomId } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json(); 
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addSong = (song) => {
    socket.emit('intent:add-song', { roomId, song });
    setQuery('');
    setResults([]);
  };

  return (
    <div className="h-full flex flex-col min-h-0">
       <form onSubmit={handleSearch} className="flex gap-3 mb-6 relative">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500" size={20} />
            <input 
                className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 rounded-xl border border-neutral-700/50 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all text-white placeholder-neutral-500" 
                placeholder="Search songs..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-95 flex items-center gap-2"
          >
             <span className="hidden md:inline">Search</span>
             <Search size={20} className="md:hidden" />
          </button>
       </form>
       
       <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
          {loading && (
              <div className="flex items-center justify-center py-12 text-neutral-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
                  Searching...
              </div>
          )}
          
          {results.length === 0 && !loading && query && (
              <div className="text-center text-neutral-500 py-12 flex flex-col items-center">
                  <Search size={48} className="opacity-20 mb-4" />
                  <p>No results found for "{query}"</p>
              </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {results.map(song => (
                <div key={song.id} className="flex items-center p-3 bg-neutral-900/30 border border-neutral-800 rounded-xl hover:bg-neutral-800/80 hover:border-neutral-700 transition-all group">
                    <div className="min-w-0 flex-grow pr-3">
                    <p className="font-semibold truncate text-neutral-200">{song.title}</p>
                    <p className="text-xs text-neutral-400 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-600"></span>
                        {song.artist}
                    </p>
                    </div>
                    <button 
                    onClick={() => addSong(song)}
                    className="p-2 bg-neutral-800 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transform lg:translate-x-2 lg:group-hover:translate-x-0"
                    title="Add to queue"
                    >
                    <Plus size={20} />
                    </button>
                </div>
            ))}
          </div>
       </div>
    </div>
  );
}
