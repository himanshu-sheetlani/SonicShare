import { useState } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { Copy, Disc } from 'lucide-react';
import { Player } from './Player';
import { MusicSearch } from './MusicSearch';

export function Room() {
    const { roomId, roomState } = useStore();
    
    return (
        <div className="w-full max-w-6xl flex flex-col md:flex-row gap-4 md:gap-6 p-4 min-h-screen md:h-[90vh]">
            {/* Left Panel: Player & Current Song */}
            <div className="flex-none md:flex-1 bg-neutral-800 rounded-2xl p-4 md:p-6 border border-neutral-700 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Disc className="text-indigo-400" />
                        Room: <span className="font-mono text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded">{roomId}</span>
                    </h2>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(roomId);
                            // feedback?
                        }}
                        className="p-2 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-colors"
                        title="Copy Room ID"
                    >
                        <Copy size={18} />
                    </button>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-neutral-900/50 rounded-xl mb-6 shadow-inner border border-neutral-800">
                    {roomState?.currentSong ? (
                        <>
                             <div className={`w-48 h-48 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-6 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20 ${roomState.playbackState === 'playing' ? 'animate-spin-slow' : ''}`}>
                                <Disc size={80} className="text-white/80" />
                             </div>
                             <h3 className="text-2xl font-bold truncate max-w-full mb-1 text-white">{roomState.currentSong.title}</h3>
                             <p className="text-neutral-400">{roomState.currentSong.artist}</p>
                        </>
                    ) : (
                        <div className="text-neutral-500 flex flex-col items-center">
                            <Disc size={48} className="mb-4 opacity-50" />
                            <p className="mb-2 font-medium">No song playing</p>
                            <p className="text-sm">Add songs to the playlist to start listening</p>
                        </div>
                    )}
                </div>

                {/* Player Controls */}
                <div className="bg-neutral-900/80 p-6 rounded-xl backdrop-blur-sm border border-neutral-800">
                    <Player />
                </div>
            </div>

            {/* Right Panel: Playlist & Search */}
            <div className="flex-1 flex flex-col gap-4 md:gap-6 min-h-0">
                <div className="bg-neutral-800 rounded-2xl p-4 md:p-6 border border-neutral-700 flex-grow overflow-hidden flex flex-col shadow-xl min-h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-neutral-300">Queue</h3>
                        <span className="text-xs font-mono text-neutral-500">{roomState?.playlist?.length || 0} songs</span>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {roomState?.playlist?.length > 0 ? (
                            roomState.playlist.map((song, idx) => (
                                <div key={`${song.id}-${idx}`} className="flex items-center gap-3 p-3 bg-neutral-700/30 border border-transparent hover:border-neutral-600 rounded-lg hover:bg-neutral-700 transition-all group">
                                    <span className="text-neutral-500 text-sm w-6 text-center font-mono">{idx + 1}</span>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-medium truncate text-neutral-200">{song.title}</p>
                                        <p className="text-xs text-neutral-400 truncate">{song.artist}</p>
                                    </div>
                                    <button 
                                        onClick={() => socket.emit('intent:remove-song', { roomId, songId: song.id })}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-600 rounded-full transition-all"
                                        title="Remove"
                                    >
                                        &times; 
                                    </button>
                                </div>
                            ))
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-neutral-500 opacity-50">
                                 <p className="text-sm">Queue is empty</p>
                             </div>
                        )}
                    </div>
                </div>

                <div className="bg-neutral-800 rounded-2xl p-4 md:p-6 border border-neutral-700 md:h-[40%] flex-none flex flex-col shadow-xl">
                    <h3 className="text-lg font-semibold mb-4 text-neutral-300">Add Songs</h3>
                    <MusicSearch />
                </div>
            </div>
        </div>
    );
}
