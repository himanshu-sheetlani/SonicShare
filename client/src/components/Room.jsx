import { useState } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';
import { Copy, Disc } from 'lucide-react';
import { Player } from './Player';
import { MusicSearch } from './MusicSearch';

export function Room() {
    const { roomId, roomState } = useStore();
    
    return (
        <div className="w-full max-w-[95%] xl:max-w-[1800px] flex flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-6 min-h-[calc(100vh-2rem)]">
            {/* Left Panel: Player & Current Song */}
            <div className="flex-none lg:w-[40%] xl:w-[35%] bg-neutral-800 rounded-3xl p-6 md:p-8 border border-neutral-700 flex flex-col shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                     <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-900/10 rounded-full blur-[80px]"></div>
                     <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[60px]"></div>
                </div>

                <div className="relative z-10 flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Disc className="text-indigo-400" />
                        <span className="hidden sm:inline">Room:</span> 
                        <span className="font-mono text-indigo-300 bg-indigo-900/30 px-3 py-1 rounded-lg border border-indigo-500/20">{roomId}</span>
                    </h2>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(roomId);
                            // feedback?
                        }}
                        className="p-2.5 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-all hover:scale-110 active:scale-95"
                        title="Copy Room ID"
                    >
                        <Copy size={20} />
                    </button>
                </div>

                <div className="relative z-10 flex-grow flex flex-col items-center justify-center text-center p-8 lg:p-12 bg-neutral-900/50 rounded-2xl mb-8 shadow-inner border border-neutral-800/50 backdrop-blur-sm">
                    {roomState?.currentSong ? (
                        <>
                             <div className={`w-56 h-56 md:w-72 md:h-72 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-8 mx-auto flex items-center justify-center shadow-2xl shadow-indigo-900/30 ring-4 ring-white/5 ${roomState.playbackState === 'playing' ? 'animate-spin-slow' : ''}`}>
                                <Disc size={120} className="text-white/80" />
                             </div>
                             <h3 className="text-3xl font-bold truncate max-w-full mb-2 text-white tracking-tight">{roomState.currentSong.title}</h3>
                             <p className="text-lg text-neutral-400 font-medium">{roomState.currentSong.artist}</p>
                        </>
                    ) : (
                        <div className="text-neutral-500 flex flex-col items-center py-10">
                            <div className="p-6 bg-neutral-800 rounded-full mb-6">
                                <Disc size={64} className="opacity-50" />
                            </div>
                            <p className="mb-2 text-xl font-semibold text-neutral-400">No song playing</p>
                            <p className="text-sm max-w-xs">Add songs to the queue to start the party</p>
                        </div>
                    )}
                </div>

                {/* Player Controls */}
                <div className="relative z-10 bg-neutral-900/80 p-6 md:p-8 rounded-2xl backdrop-blur-md border border-neutral-800/50 shadow-lg">
                    <Player />
                </div>
            </div>

            {/* Right Panel: Playlist & Search */}
            <div className="flex-1 flex flex-col gap-4 md:gap-6 min-h-0 lg:h-auto">
                {/* Queue Section */}
                <div className="bg-neutral-800 rounded-3xl p-6 border border-neutral-700 flex-grow-[2] overflow-hidden flex flex-col shadow-xl min-h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                             <h3 className="text-xl font-bold text-white">Queue</h3>
                             <span className="px-2.5 py-0.5 rounded-full bg-neutral-700 text-xs font-medium text-neutral-300 border border-neutral-600">
                                {roomState?.playlist?.length || 0}
                             </span>
                        </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {roomState?.playlist?.length > 0 ? (
                            roomState.playlist.map((song, idx) => (
                                <div key={`${song.id}-${idx}`} className="flex items-center gap-4 p-3 hover:bg-neutral-700/50 rounded-xl transition-all group border border-transparent hover:border-neutral-600/50">
                                    <span className="text-neutral-500 text-sm w-6 text-center font-mono font-medium group-hover:text-indigo-400">{idx + 1}</span>
                                    
                                    {/* Thumbnail Placeholder (if we had one) */}
                                    <div className="w-10 h-10 rounded bg-neutral-700 flex items-center justify-center flex-shrink-0 text-neutral-500">
                                        <Disc size={20} />
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold truncate text-neutral-200 text-base">{song.title}</p>
                                        <p className="text-sm text-neutral-400 truncate">{song.artist}</p>
                                    </div>
                                    <button 
                                        onClick={() => socket.emit('intent:remove-song', { roomId, songId: song.id })}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        title="Remove"
                                    >
                                        &times; 
                                    </button>
                                </div>
                            ))
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-neutral-500 opacity-60">
                                 <p className="text-lg font-medium">Queue is empty</p>
                                 <p className="text-sm">Search for songs to add them here</p>
                             </div>
                        )}
                    </div>
                </div>

                {/* Search Section */}
                <div className="bg-neutral-800 rounded-3xl p-6 border border-neutral-700 flex-grow-[1] flex-shrink-0 flex flex-col shadow-xl min-h-[300px]">
                    <h3 className="text-xl font-bold mb-4 text-white">Add Songs</h3>
                    <MusicSearch />
                </div>
            </div>
        </div>
    );
}
