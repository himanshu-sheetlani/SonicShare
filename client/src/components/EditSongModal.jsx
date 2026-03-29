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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02060d]/72 p-4 backdrop-blur-sm">
      <div className="max-h-96 w-full max-w-md flex flex-col rounded-3xl border border-white/10 bg-[#0c1728]/95 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white">Edit Song</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/50 hover:text-white disabled:opacity-50 transition-colors"
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
              className="w-full rounded-lg border border-white/10 bg-[#08111d] px-3 py-2 text-white placeholder:text-white/25 focus:border-[#34d266]/40 focus:outline-none disabled:opacity-50"
              placeholder="Song title"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="text-sm font-medium text-white/75 block mb-2">
              Artist Name
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-[#08111d] px-3 py-2 text-white placeholder:text-white/25 focus:border-[#34d266]/40 focus:outline-none disabled:opacity-50"
              placeholder="Artist name"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="text-sm font-medium text-white/75 block mb-2">
              Genre
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-[#08111d] px-3 py-2 text-white placeholder:text-white/25 focus:border-[#34d266]/40 focus:outline-none disabled:opacity-50"
              placeholder="Genre"
            />
          </div>

          {/* Album */}
          <div>
            <label className="text-sm font-medium text-white/75 block mb-2">
              Album
            </label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-[#08111d] px-3 py-2 text-white placeholder:text-white/25 focus:border-[#34d266]/40 focus:outline-none disabled:opacity-50"
              placeholder="Album name"
            />
          </div>

          {/* Cloudinary URL */}
          {song.cloudinaryUrl && (
            <div>
              <label className="text-sm font-medium text-white/75 block mb-2">
                Stream URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={song.cloudinaryUrl}
                  disabled
                  className="flex-1 rounded-lg border border-white/10 bg-[#08111d] px-3 py-2 text-xs text-white/35 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  disabled={loading}
                  className="rounded-lg border border-white/10 bg-[#08111d] p-2 transition-colors hover:border-[#34d266]/30 disabled:opacity-50"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/45" />
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
        <div className="flex gap-2 border-t border-white/10 bg-[#08111d]/70 p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-white/10 px-4 py-2 font-medium text-white/75 transition-colors hover:bg-white/6 disabled:cursor-not-allowed disabled:text-white/25"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#34d266] to-[#2d7cf6] px-4 py-2 font-medium text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-white/35"
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
