import { useState } from 'react';
import { socket } from '../socket';
import { Music, Users, ArrowRight, PlayCircle, Sparkles, Radio, Share2 } from 'lucide-react';

export function LandingPage({ error }) {
  const [inputRoomId, setInputRoomId] = useState('');

  const handleCreate = () => {
    socket.emit('create-room');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputRoomId.trim()) {
      socket.emit('join-room', inputRoomId.trim());
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex flex-col md:flex-row bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-neutral-950 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Left Section: Hero / Branding (Desktop only, or stacked on mobile) */}
      <div className="relative z-10 w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 lg:p-24 text-center md:text-left">
        <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-6">
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-neutral-900 p-3 rounded-full border border-neutral-700">
                    <Music size={32} className="text-white transform group-hover:scale-110 transition-transform duration-300" />
                </div>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400 tracking-tight">SonicShare</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tighter mb-6 leading-[1.1]">
            Listen <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Together.</span>
        </h1>
        
        <p className="text-neutral-400 text-lg md:text-xl max-w-md mx-auto md:mx-0 mb-8 leading-relaxed">
            Real-time collaborative music listening. Sync playback, vote on tracks, and enjoy music with friends, anywhere.
        </p>

        <div className="hidden md:flex flex-wrap gap-4 text-sm font-medium text-neutral-500">
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900/50 rounded-full border border-neutral-800">
                <Radio size={16} className="text-indigo-400" />
                <span>Synchronized Playback</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900/50 rounded-full border border-neutral-800">
                <Users size={16} className="text-purple-400" />
                <span>Group Listening</span>
            </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900/50 rounded-full border border-neutral-800">
                <Share2 size={16} className="text-pink-400" />
                <span>Instant Sharing</span>
            </div>
        </div>
      </div>

      {/* Right Section: Action Card */}
      <div className="relative z-10 w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md backdrop-blur-xl bg-neutral-900/60 border border-neutral-800 rounded-3xl p-8 shadow-2xl shadow-indigo-900/10 overflow-hidden transform transition-all hover:scale-[1.01]">
            {/* Mobile Header (Hidden on Desktop) */}
            <div className="md:hidden flex flex-col items-center mb-8 text-center">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Start Listening</h1>
                <p className="text-neutral-400 text-sm">Join a room or create a new one</p>
            </div>

            {/* Actions */}
            <div className="space-y-6">
                <button 
                    onClick={handleCreate}
                    className="group w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition-all transform hover:-translate-y-0.5 hover:shadow-indigo-900/50 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
                    <Users size={22} className="relative z-10" />
                    <span className="relative z-10">Create a New Room</span>
                    <ArrowRight size={18} className="relative z-10 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                </button>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-neutral-800"></div>
                    <span className="mx-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">or join existing</span>
                    <div className="flex-grow border-t border-neutral-800"></div>
                </div>

                <form onSubmit={handleJoin} className="relative group">
                    <input
                        id="roomId"
                        type="text"
                        value={inputRoomId}
                        onChange={(e) => setInputRoomId(e.target.value)}
                        placeholder="Paste Room ID here..."
                        className="w-full pl-5 pr-12 py-4 bg-neutral-950/50 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none text-white placeholder-neutral-600 transition-all text-center tracking-wider font-mono text-lg"
                    />
                    <button 
                        type="submit"
                        disabled={!inputRoomId.trim()}
                        className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 disabled:opacity-0 disabled:pointer-events-none rounded-lg text-white transition-all duration-200"
                    >
                        <ArrowRight size={20} />
                    </button>
                </form>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-xl text-center animate-shake backdrop-blur-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-neutral-800 text-center">
                 <p className="text-xs text-neutral-600">
                    Sync music • Vote tracks • Audio visualization
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
