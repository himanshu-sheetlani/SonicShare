import { useState, useEffect } from 'react'
import { LandingPage } from './components/LandingPage'
import { Room } from './components/Room'
import { useStore } from './store'
import { socket } from './socket'

function App() {
  const { roomId, setRoomId, setRoomState, setUserId } = useStore()
  const [error, setError] = useState(null)

  useEffect(() => {
    function onConnect() {
      setUserId(socket.id);
    }

    function onRoomJoined(room) {
      setRoomId(room.roomId);
      setRoomState(room);
      setError(null);
    }
    
    function onRoomState(room) {
       setRoomState(room);
    }

    function onConnectError(err) {
       setError("Connection failed: " + err.message);
    }

    function onError(message) {
         setError(typeof message === 'string' ? message : message.message);
         setTimeout(() => setError(null), 3000);
    }

    socket.on('connect', onConnect);
    socket.on('room-joined', onRoomJoined);
    socket.on('room-state', onRoomState); // Full state update
    // Sync updates handled in components usually, but room-state handles everything for now
    
    socket.on('error', onError);
    socket.on('connect_error', onConnectError);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('room-joined', onRoomJoined);
      socket.off('room-state', onRoomState);
      socket.off('error', onError);
      socket.off('connect_error', onConnectError);
      socket.disconnect();
    };
  }, [setRoomId, setRoomState, setUserId]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {roomId ? (
        <Room />
      ) : (
        <LandingPage error={error} />
      )}
    </div>
  )
}

export default App
