import React, { useEffect, useState } from "react";
import { Trash2, Edit2, Loader } from "lucide-react";

export default function UploadedSongsList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSong, setEditingSong] = useState(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/firestore-songs`);
      const data = await response.json();
      setSongs(data || []);
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSong = async (songId) => {
    if (!window.confirm("Are you sure you want to delete this song?")) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/songs/${songId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSongs(songs.filter((song) => song.id !== songId));
      } else {
        alert("Failed to delete song");
      }
    } catch (error) {
      console.error("Error deleting song:", error);
      alert("Error deleting song");
    }
  };

  const handleSongUpdated = (updatedSong) => {
    setSongs(songs.map((song) => (song.id === updatedSong.id ? updatedSong : song)));
    setEditingSong(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400">No songs uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white mb-4">Uploaded Songs</h3>
        <div className="max-h-96 overflow-y-auto space-y-3">
          {songs.map((song) => (
            <div
              key={song.id}
              className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-medium truncate">
                    {song.title || "Untitled"}
                  </h4>
                  <p className="text-sm text-neutral-400 truncate">
                    {song.artist || "Unknown Artist"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {song.genre && `Genre: ${song.genre}`}
                  </p>
                  {song.uploadedAt && (
                    <p className="text-xs text-neutral-600 mt-1">
                      {new Date(song.uploadedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingSong(song)}
                    className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-neutral-900 rounded-lg transition-colors"
                    title="Edit song"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSong(song.id)}
                    className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors"
                    title="Delete song"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingSong && (
        <EditSongModal
          song={editingSong}
          onClose={() => setEditingSong(null)}
          onSave={handleSongUpdated}
        />
      )}
    </>
  );
}
