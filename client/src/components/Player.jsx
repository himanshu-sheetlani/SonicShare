import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { socket } from '../socket';
import { useStore } from '../store';

export function Player() {
  const { roomId, roomState } = useStore();
  const audioRef = useRef(new Audio());
  const [volume, setVolume] = useState(1);

  // Sync Logic
  useEffect(() => {
    if (!roomState) return;

    const audio = audioRef.current;
    
    // Change Source if needed
    if (roomState.currentSong?.streamUrl) {
       // Only update src if different to avoid reloading
       // Note: audio.src might be absolute URL, streamUrl might be relative or absolute.
       // Compare carefully or just check ID if we stored it?
       // Simplest: store last played URL in ref?
       if (decodeURIComponent(audio.src) !== decodeURIComponent(roomState.currentSong.streamUrl) && 
           audio.src !== roomState.currentSong.streamUrl) {
           audio.src = roomState.currentSong.streamUrl;
           audio.load();
           // If we just loaded, we should set state to pause momentarily until sync logic kicks in?
       }
    } else {
        if (audio.src) {
            audio.pause();
            audio.src = "";
        }
    }

    const sync = () => {
        if (!roomState.currentSong) return;

        if (roomState.playbackState === 'playing') {
             const now = Date.now();
             const lastSync = roomState.lastSyncTime || now;
             const baseTime = roomState.baseTimestamp || 0;
             
             // Expected time in seconds
             // If lastSync is in future (PLAY_AT), we wait.
             // But roomState.lastSyncTime from server (PLAY_AT) is usually +500ms from when server received it.
             // If we are late, (now > lastSync), then elapsed = now - lastSync.
             // If we are early (now < lastSync), we wait.
             
             let expectedTime = baseTime;
             if (now > lastSync) {
                 expectedTime += (now - lastSync) / 1000;
             }
             
             // Handle future start
             if (now < lastSync) {
                 const delay = lastSync - now;
                 setTimeout(() => {
                     audio.currentTime = baseTime;
                     audio.play().catch(e => console.warn('Autoplay blocked', e));
                 }, delay);
                 return;
             }

             // Check drift
             const drift = Math.abs(audio.currentTime - expectedTime);
             // If drift is large (> 0.3s) or we are paused but should be playing, fix it.
             
             if (audio.paused) {
                 audio.currentTime = expectedTime;
                 audio.play().catch(e => console.warn('Autoplay blocked', e));
             } else if (drift > 0.3) {
                 console.log(`Syncing: drift ${drift.toFixed(3)}s`);
                 audio.currentTime = expectedTime;
             }
        } else {
             if (!audio.paused) audio.pause();
             // Sync position on pause too?
             if (Math.abs(audio.currentTime - roomState.baseTimestamp) > 0.5) {
                 audio.currentTime = roomState.baseTimestamp;
             }
        }
    };
    
    sync();
    
    // Periodic drift check
    const interval = setInterval(sync, 1000); // Check every second
    return () => clearInterval(interval);

  }, [roomState]);
  
  // Event Listeners
  useEffect(() => {
     const audio = audioRef.current;
     
     const handleEnded = () => {
         socket.emit('intent:song-ended', { roomId });
     };
     
     audio.addEventListener('ended', handleEnded);
     return () => audio.removeEventListener('ended', handleEnded);
  }, [roomId]);

  const togglePlay = () => {
      if (!roomState.currentSong) return;
      if (roomState.playbackState === 'playing') {
          socket.emit('intent:pause', { roomId, timestamp: audioRef.current.currentTime });
      } else {
          socket.emit('intent:play', { roomId, timestamp: audioRef.current.currentTime });
      }
  };

  const skip = () => {
      socket.emit('intent:skip', { roomId });
  };

  return (
    <div className="flex flex-col items-center w-full">
        {/* Simple Progress Bar */}
        <div className="w-full h-1.5 bg-neutral-700 rounded-full mb-6 overflow-hidden relative group">
             {/* We need a real progress bar that updates? For now, purely visual/static or simple animation */}
             <div className="h-full bg-indigo-500 w-full origin-left transform scale-x-0 animate-progress" 
                  style={{ 
                      // Simple hack: if playing, use CSS animation? No, react state is better but expensive.
                      // For V1, just show static buffer.
                      width: '0%' 
                  }}
             ></div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
            <button className="text-neutral-500 hover:text-white transition-colors" disabled>
                <SkipBack size={24} />
            </button>
            
            <button 
                onClick={togglePlay}
                disabled={!roomState?.currentSong}
                className="p-4 bg-white text-black rounded-full hover:scale-105 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-white/10"
            >
                {roomState?.playbackState === 'playing' ? (
                    <Pause fill="black" size={28} />
                ) : (
                    <Play fill="black" className="ml-1" size={28} />
                )}
            </button>
            
            <button 
                onClick={skip}
                disabled={!roomState?.currentSong}
                className="text-neutral-400 hover:text-white transition-colors hover:scale-110"
            >
                <SkipForward size={24} />
            </button>
        </div>
    </div>
  );
}
