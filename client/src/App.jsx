import { useState, useEffect } from 'react'
import { LandingPage } from './components/LandingPage'
import { Room } from './components/Room'
import Admin from './pages/Admin'
import { useStore } from './store'
import { socket } from './socket'

function App() {
  const { roomId, setRoomId, setRoomState, setUserId, currentPage } = useStore()
  const [error, setError] = useState(null)

  useEffect(() => {
    function onConnect() {
      setUserId(socket.id);
    }

    function onRoomJoined(room) {
      setRoomId(room.roomId);
      setRoomState(room.state || room);
      setError(null);
    }
    
    function onRoomState(room) {
       const stateToSet = room.state || room;
       
       // Ensure streamUrl is a full URL
       if (stateToSet.currentSong && stateToSet.currentSong.streamUrl) {
         if (!stateToSet.currentSong.streamUrl.startsWith('http')) {
           stateToSet.currentSong.streamUrl = `${import.meta.env.VITE_BACKEND_URL}${stateToSet.currentSong.streamUrl}`;
         }
       }
       
       setRoomState(stateToSet);
    }

    function onConnectError(err) {
       setError("Connection failed: " + err.message);
    }

    function onError(message) {
         setError(typeof message === 'string' ? message : message.message);
         setTimeout(() => setError(null), 3000);
    }

    function onPlaylistUpdate(playlist) {
      const updatedPlaylist = playlist.map(song => {
        if (song.streamUrl && !song.streamUrl.startsWith('http')) {
          return {
            ...song,
            streamUrl: `${import.meta.env.VITE_BACKEND_URL}${song.streamUrl}`
          };
        }
        return song;
      });
      setRoomState(prev => prev ? { ...prev, playlist: updatedPlaylist } : null);
    }

    function onSyncUpdate(update) {
        setRoomState(prev => prev ? { ...prev, ...update } : null);
    }

    socket.on('connect', onConnect);
    socket.on('room-joined', onRoomJoined);
    socket.on('room-state', onRoomState); 
    socket.on('playlist-update', onPlaylistUpdate);
    socket.on('sync-update', onSyncUpdate);
    
    socket.on('error', onError);
    socket.on('connect_error', onConnectError);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('room-joined', onRoomJoined);
      socket.off('room-state', onRoomState);
      socket.off('playlist-update', onPlaylistUpdate);
      socket.off('sync-update', onSyncUpdate);
      socket.off('error', onError);
      socket.off('connect_error', onConnectError);
      socket.disconnect();
    };
  }, [setRoomId, setRoomState, setUserId]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {currentPage === 'admin' ? (
        <Admin />
      ) : roomId ? (
        <Room />
      ) : (
        <LandingPage error={error} />
      )}
    </div>
  )
}

export default App
