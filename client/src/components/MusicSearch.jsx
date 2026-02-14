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
       <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input 
            className="flex-grow px-3 py-2 bg-neutral-900 rounded-lg border border-neutral-700 focus:outline-none focus:border-indigo-500 transition-colors" 
            placeholder="Search songs..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
             <Search size={20} />
          </button>
       </form>
       
       <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading && <p className="text-center text-sm text-neutral-500 py-4">Searching...</p>}
          {results.length === 0 && !loading && query && (
              <p className="text-center text-sm text-neutral-500 py-4">No results found</p>
          )}
          {results.map(song => (
             <div key={song.id} className="flex justify-between items-center p-3 bg-neutral-900/50 rounded-lg hover:bg-neutral-700 transition-colors group">
                <div className="min-w-0 pr-2">
                   <p className="font-medium truncate text-sm text-neutral-200">{song.title}</p>
                   <p className="text-xs text-neutral-400 truncate">{song.artist}</p>
                </div>
                <button 
                  onClick={() => addSong(song)}
                  className="p-1.5 hover:bg-indigo-600/20 bg-neutral-800 rounded-full text-indigo-400 hover:text-indigo-300 transition-all opacity-0 group-hover:opacity-100"
                  title="Add to queue"
                >
                  <Plus size={16} />
                </button>
             </div>
          ))}
       </div>
    </div>
  );
}
