import { useStore } from '../store';
import { socket } from '../socket';
import { Copy, Disc, ArrowLeft } from 'lucide-react';
import { Player } from './Player';
import { SongsList } from './SongsList';

export function Room() {
    const { roomId, roomState, resetRoom, setCurrentPage } = useStore();

    const handleLeaveRoom = async () => {
        await socket.leaveRoom();
        resetRoom();
        setCurrentPage('landing');
    };
    
    return (
        <div className="relative w-full flex flex-col min-h-screen overflow-hidden bg-[#07111f] text-white">
            <div className="absolute inset-0 opacity-30 bg-[linear-gradient(120deg,transparent_0%,rgba(80,121,255,0.12)_32%,transparent_48%),linear-gradient(240deg,transparent_0%,rgba(46,213,115,0.08)_28%,transparent_45%)]" />

            {/* Header with Logo */}
            <div className="relative z-10 px-4 md:px-6 py-4 md:py-5 border-b border-white/10 bg-[#08111d]/70 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3 max-w-[1800px] mx-auto">
                    <div className="flex items-center gap-3">
                        <img src="/SonicShare_logo-TransparentBG.png" alt="SonicShare" className="h-8 md:h-10 object-contain" />
                        <span className="text-lg md:text-xl font-bold text-white">SonicShare</span>
                    </div>
                    <button
                        onClick={handleLeaveRoom}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft size={16} />
                        Leave room
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-2 w-full max-w-[100%] xl:max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-6 min-h-[calc(100vh-5rem)]">
            {/* Left Panel: Player & Current Song */}
            <div className="flex-none max-h-[90vh] lg:w-[40%] xl:w-[35%] bg-[#0c1728]/88 rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                     <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-[#2d7cf6]/14 rounded-full blur-[80px]"></div>
                </div>

                <div className="relative z-10 flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Disc className="text-[#56e084]" />
                        <span className="hidden sm:inline">Room:</span> 
                        <span className="font-mono text-[#9deab4] bg-[#34d266]/10 px-3 py-1 rounded-lg border border-[#34d266]/20">{roomId}</span>
                    </h2>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(roomId);
                        }}
                        className="p-2.5 hover:bg-white/10 rounded-full text-white/55 hover:text-white transition-all hover:scale-110 active:scale-95"
                        title="Copy Room ID"
                    >
                        <Copy size={20} />
                    </button>
                </div>

                {/* Player Component */}
                <div className="relative z-10 flex-grow min-h-0">
                    <Player />
                </div>
            </div>

            {/* Right Panel: Playlist & Search */}
            <div className="flex-1 flex flex-col gap-4 md:gap-6 min-h-0 lg:h-auto">
                {/* Queue Section */}
                <div className="bg-[#0c1728]/88 rounded-3xl p-6 border border-white/10 flex-grow-[2] overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl min-h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                             <h3 className="text-xl font-bold text-white">Queue</h3>
                             <span className="px-2.5 py-0.5 rounded-full bg-white/6 text-xs font-medium text-white/75 border border-white/10">
                                {roomState?.playlist?.length || 0}
                             </span>
                        </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {roomState?.playlist?.length > 0 ? (
                            roomState.playlist.map((song, idx) => (
                                <div key={`${song.id}-${idx}`} className="flex items-center gap-4 p-3 hover:bg-white/6 rounded-xl transition-all group border border-transparent hover:border-white/10">
                                    <span className="text-white/40 text-sm w-6 text-center font-mono font-medium group-hover:text-[#56e084]">{idx + 1}</span>
                                    
                                    {/* Thumbnail */}
                                    <div className="w-10 h-10 rounded bg-white/8 overflow-hidden flex-shrink-0 relative border border-white/10">
                                        {song.thumbnail ? (
                                            <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/35">
                                                <Disc size={20} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold truncate text-white text-base">{song.title}</p>
                                        <p className="text-sm text-white/55 truncate">{song.artist}</p>
                                    </div>
                                    <button 
                                        onClick={() => socket.emit('intent:remove-song', { roomId, songId: song.id })}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-white/45 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"
                                        title="Remove"
                                    >
                                        &times; 
                                    </button>
                                </div>
                            ))
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-white/40 opacity-80">
                                 <p className="text-lg font-medium">Queue is empty</p>
                                 <p className="text-sm">Add songs to get started</p>
                             </div>
                        )}
                    </div>
                </div>

                {/* Available Songs Section */}
                <div className="bg-[#0c1728]/88 rounded-3xl p-6 border border-white/10 flex-grow-[1] flex-shrink-0 flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl min-h-[300px]">
                    <SongsList />
                </div>
            </div>
            </div>
        </div>
    );
}
