import { useState } from 'react';
import { socket } from '../socket';
import { Music, Users, ArrowRight, PlayCircle, Sparkles } from 'lucide-react';

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
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-neutral-950">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/30 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/30 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-lg p-4 md:p-6">
        {/* Card Container */}
        <div className="backdrop-blur-xl bg-neutral-900/60 border border-neutral-800 rounded-3xl p-8 shadow-2xl shadow-black/50 overflow-hidden">
             {/* Header */}
            <div className="flex flex-col items-center mb-10 text-center">
                <div className="relative mb-4 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-neutral-900 p-4 rounded-full border border-neutral-700">
                        <Music size={40} className="text-white transform group-hover:scale-110 transition-transform duration-300" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-500 tracking-tight mb-2">
                    SonicShare
                </h1>
                <p className="text-neutral-400 text-sm font-medium flex items-center gap-2">
                    <Sparkles size={14} className="text-yellow-400" />
                    Real-time collaborative listening
                    <Sparkles size={14} className="text-yellow-400" />
                </p>
            </div>

            {/* Actions */}
            <div className="space-y-6">
                <button 
                    onClick={handleCreate}
                    className="group w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/40 transition-all transform hover:-translate-y-0.5 hover:shadow-indigo-900/60 flex items-center justify-center gap-3"
                >
                    <Users size={22} />
                    <span>Create a New Room</span>
                    <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
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
                        className="w-full pl-5 pr-12 py-4 bg-neutral-950/50 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none text-white placeholder-neutral-600 transition-all text-center tracking-wider font-mono"
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
