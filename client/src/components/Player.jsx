import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
} from "lucide-react";
import { socket } from "../socket";
import { useStore } from "../store";

const formatTime = (seconds) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export function Player() {
  const { roomId, roomState } = useStore();
  const audioRef = useRef(new Audio());
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Sync Logic
  useEffect(() => {
    if (!roomState) return;

    // ... (logs removed for brevity, keeping core logic) ...

    const audio = audioRef.current;

    // Error handling
    const handleError = (e) => {
      console.error("Audio Error:", e, audio.error);
    };
    audio.addEventListener("error", handleError);

    // Update duration from server if available (more reliable for some streams)
    if (roomState.currentSong?.duration) {
      setDuration(roomState.currentSong.duration);
    }

    // Change Source if needed
    if (roomState.currentSong?.streamUrl) {
      if (
        decodeURIComponent(audio.src) !==
          decodeURIComponent(roomState.currentSong.streamUrl) &&
        audio.src !== roomState.currentSong.streamUrl
      ) {
        audio.src = roomState.currentSong.streamUrl;
        audio.load();
      }
    } else {
      if (audio.src) {
        audio.pause();
        audio.src = "";
        setCurrentTime(0);
        setDuration(0);
      }
    }

    const sync = () => {
      if (!roomState.currentSong) return;

      if (roomState.playbackState === "playing") {
        const now = Date.now();
        const lastSync = roomState.lastSyncTime || now;
        const baseTime = roomState.baseTimestamp || 0;

        let expectedTime = baseTime;
        if (now > lastSync) {
          expectedTime += (now - lastSync) / 1000;
        }

        // Handle future start
        if (now < lastSync) {
          const delay = lastSync - now;
          setTimeout(() => {
            audio.currentTime = baseTime;
            audio
              .play()
              .catch((e) => console.error("Autoplay blocked (future):", e));
          }, delay);
          return;
        }

        // Check drift
        const drift = Math.abs(audio.currentTime - expectedTime);

        if (audio.paused) {
          audio.currentTime = expectedTime;
          audio
            .play()
            .catch((e) => console.error("Autoplay blocked (paused):", e));
        } else if (drift > 0.3) {
          // console.log(`Syncing: drift ${drift.toFixed(3)}s`); // Reduced logs
          audio.currentTime = expectedTime;
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
        if (Math.abs(audio.currentTime - roomState.baseTimestamp) > 0.5) {
          audio.currentTime = roomState.baseTimestamp;
        }
      }
    };

    sync();

    const interval = setInterval(sync, 1000);
    return () => {
      clearInterval(interval);
      audio.removeEventListener("error", handleError);
    };
  }, [roomState]);

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleEnded = () => {
      socket.emit("intent:song-ended", { roomId });
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (!roomState?.currentSong?.duration) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [roomId, isDragging, roomState?.currentSong]);

  // Volume Effect
  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!roomState?.currentSong) return;
    if (roomState.playbackState === "playing") {
      socket.emit("intent:pause", {
        roomId,
        timestamp: audioRef.current.currentTime,
      });
    } else {
      socket.emit("intent:play", {
        roomId,
        timestamp: audioRef.current.currentTime,
      });
    }
  };

  const skip = (direction = "next") => {
    socket.emit("intent:skip", { roomId, direction });
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    socket.emit("intent:seek", { roomId, timestamp: newTime });
  };

  const handleSeekStart = () => setIsDragging(true);
  const handleSeekEnd = (e) => {
    setIsDragging(false);
    handleSeek(e);
  };

  return (
    <div className="flex flex-col items-center w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl p-5 border border-neutral-700/50 shadow-2xl">
      {/* Album Art Container */}
      <div className="w-full mb-5 rounded-xl overflow-hidden shadow-xl border border-neutral-600/30">
        {roomState?.currentSong?.albumArt ? (
          <img
            src={roomState.currentSong.albumArt}
            alt={roomState.currentSong.title}
            className="w-full aspect-square object-cover"
          />
        ) : (
          <div className="w-full aspect-square bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
            <Music size={80} className="text-white/40" />
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="w-full text-center mb-5">
        <h3 className="text-lg font-bold text-white truncate mb-1">
          {roomState?.currentSong?.title || "No song"}
        </h3>
        <p className="text-sm text-neutral-400 truncate">
          {roomState?.currentSong?.artist || "Unknown Artist"}
        </p>
      </div>

      {/* Time Display */}
      <div className="flex justify-between items-center w-full text-xs font-mono text-neutral-400 mb-3 px-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full mb-4 px-1">
        <div className="relative h-2 group">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            onMouseDown={handleSeekStart}
            onTouchStart={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className="absolute w-full h-full opacity-0 z-10 cursor-pointer"
            disabled={!roomState?.currentSong}
          />
          <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-500 transition-all duration-100 ease-linear rounded-full shadow-lg shadow-indigo-500/50"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center justify-between w-full gap-2 mb-5 px-1">
        {/* Volume Control - Left */}
          <div className="flex items-center gap-1.5 flex-shrink-0 group">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-neutral-400 hover:text-indigo-400 transition-all p-1 flex-shrink-0"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={20} />
              ) : (
                <Volume2 size={20} />
              )}
            </button>

            <div className="w-0 overflow-hidden group-hover:w-25 transition-all duration-300">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-25 h-1.5 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

        {/* Center Controls */}
        <div className="flex items-center justify-center gap-8 flex-grow">
          <button
            onClick={() => skip("previous")}
            disabled={!roomState?.currentSong}
            className="p-2 text-neutral-400 hover:text-indigo-400 transition-all hover:scale-110 disabled:opacity-20 disabled:hover:scale-100"
            title="Previous"
          >
            <SkipBack size={24} strokeWidth={1.5} />
          </button>

          <button
            onClick={togglePlay}
            disabled={!roomState?.currentSong}
            className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-full hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/50 transition-all disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/30"
          >
            {roomState?.playbackState === "playing" ? (
              <Pause fill="white" size={28} />
            ) : (
              <Play fill="white" className="ml-1" size={28} />
            )}
          </button>

          <button
            onClick={() => skip("next")}
            disabled={!roomState?.currentSong}
            className="p-2 text-neutral-400 hover:text-indigo-400 transition-all hover:scale-110 disabled:opacity-20 disabled:hover:scale-100"
            title="Next"
          >
            <SkipForward size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
