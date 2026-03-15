import React, { useState } from "react";
import { X, Loader, Copy, Check } from "lucide-react";

export default function EditSongModal({ song, onClose, onSave }) {
  const [title, setTitle] = useState(song.title || "");
  const [artist, setArtist] = useState(song.artist || "");
  const [genre, setGenre] = useState(song.genre || "");
  const [album, setAlbum] = useState(song.album || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch(`http://localhost:3000/api/songs/${song.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          genre: genre.trim(),
          album: album.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update song");
      }

      const updatedSong = await response.json();
      setMessage({ text: "Song updated successfully!", type: "success" });
      setTimeout(() => {
        onSave(updatedSong);
      }, 500);
    } catch (error) {
      console.error("Update error:", error);
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (song.cloudinaryUrl) {
      navigator.clipboard.writeText(song.cloudinaryUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-white">Edit Song</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-neutral-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-neutral-300 block mb-2">
              Song Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              placeholder="Song title"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="text-sm font-medium text-neutral-300 block mb-2">
              Artist Name
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={loading}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              placeholder="Artist name"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="text-sm font-medium text-neutral-300 block mb-2">
              Genre
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={loading}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              placeholder="Genre"
            />
          </div>

          {/* Album */}
          <div>
            <label className="text-sm font-medium text-neutral-300 block mb-2">
              Album
            </label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              disabled={loading}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              placeholder="Album name"
            />
          </div>

          {/* Cloudinary URL */}
          {song.cloudinaryUrl && (
            <div>
              <label className="text-sm font-medium text-neutral-300 block mb-2">
                Stream URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={song.cloudinaryUrl}
                  disabled
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-500 text-xs truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  disabled={loading}
                  className="p-2 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Message */}
          {message.text && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === "error"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-green-500/10 text-green-400 border border-green-500/20"
              }`}
            >
              {message.text}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-neutral-800 bg-neutral-950">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-neutral-700 hover:border-neutral-600 disabled:border-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-neutral-300 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
