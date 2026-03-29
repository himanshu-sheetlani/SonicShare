import React, { useState } from "react";
import { Upload, Loader, AlertCircle, CheckCircle, X, Edit2 } from "lucide-react";
import { uploadSongToFirestore } from "../utils/firestoreService";
import EditSongModal from "./EditSongModal";

export default function SongUploadForm({ onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedSongs, setUploadedSongs] = useState({});
  const [message, setMessage] = useState({ text: "", type: "" });
  const [editingSongIndex, setEditingSongIndex] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const audioFiles = selectedFiles.filter((f) => f.type.startsWith("audio/"));
      setFiles((prev) => [...prev, ...audioFiles]);
      setMessage({ text: "", type: "" });
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    const nextUploadedSongs = { ...uploadedSongs };
    delete nextUploadedSongs[index];
    setUploadedSongs(nextUploadedSongs);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setMessage({
        text: "Please select at least one audio file",
        type: "error",
      });
      return;
    }

    setUploading(true);
    setMessage({ text: "", type: "" });
    const progress = {};
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      progress[i] = "uploading";
      setUploadProgress({ ...progress });

      try {
        const response = await uploadSongToFirestore(file, {});
        progress[i] = "success";
        setUploadedSongs((prev) => ({
          ...prev,
          [i]: response,
        }));
        successCount += 1;
      } catch (error) {
        progress[i] = "error";
        errorCount += 1;
        console.error(`Failed to upload ${file.name}:`, error);
      }

      setUploadProgress({ ...progress });
    }

    setUploading(false);

    if (errorCount === 0) {
      setMessage({
        text: `Successfully uploaded ${successCount} song${successCount !== 1 ? "s" : ""}!`,
        type: "success",
      });
    } else if (successCount === 0) {
      setMessage({
        text: `Failed to upload ${errorCount} file${errorCount !== 1 ? "s" : ""}. Try again.`,
        type: "error",
      });
    } else {
      setMessage({
        text: `Uploaded ${successCount} file${successCount !== 1 ? "s" : ""}, failed ${errorCount}.`,
        type: "error",
      });
    }

    if (onUploadSuccess && successCount > 0) {
      setTimeout(onUploadSuccess, 500);
    }
  };

  const handleSongUpdated = (index, updatedSong) => {
    setUploadedSongs((prev) => ({
      ...prev,
      [index]: updatedSong,
    }));
    setEditingSongIndex(null);
  };

  return (
    <div className="bg-[#0c1728]/88 border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg border border-[#34d266]/20 bg-[#34d266]/10 p-2">
          <Upload className="h-5 w-5 text-[#56e084]" />
        </div>
        <h2 className="text-lg font-semibold text-white">Upload Songs</h2>
      </div>

      <form onSubmit={handleUpload} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/60">
            Select Audio Files
          </label>
          <div className="relative cursor-pointer rounded-2xl border-2 border-dashed border-white/10 bg-[#08111d]/85 px-4 py-12 text-center transition-colors hover:border-[#34d266]/40">
            <input
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <div className="pointer-events-none flex flex-col items-center justify-center gap-2">
              <Upload className="h-10 w-10 text-[#56e084]" />
              <span className="font-medium text-white/85">
                Click to browse or drag and drop
              </span>
              <span className="text-xs text-white/40">
                MP3, WAV, max 50MB per file
              </span>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/60">
                Selected Files ({files.length})
              </label>
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  setUploadedSongs({});
                }}
                className="text-xs text-white/45 transition-colors hover:text-white/75"
              >
                Clear all
              </button>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#08111d]/85 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{file.name}</p>
                    <p className="text-xs text-white/40">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>

                  {uploadProgress[index] ? (
                    <div className="flex shrink-0 items-center gap-2">
                      {uploadProgress[index] === "uploading" && (
                        <Loader className="h-4 w-4 animate-spin text-[#56e084]" />
                      )}
                      {uploadProgress[index] === "success" && (
                        <CheckCircle className="h-5 w-5 shrink-0 text-green-400" />
                      )}
                      {uploadProgress[index] === "error" && (
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        disabled={uploading}
                        className="text-white/40 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSongIndex(index)}
                        disabled={uploading}
                        className="rounded p-1 text-white/50 transition-colors hover:bg-white/8 hover:text-[#56e084] disabled:opacity-50"
                        title="Edit metadata"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {message.text && (
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
              message.type === "error"
                ? "border-red-500/20 bg-red-500/10 text-red-300"
                : "border-green-500/20 bg-green-500/10 text-green-300"
            }`}
          >
            {message.type === "error" ? (
              <AlertCircle className="h-5 w-5 shrink-0" />
            ) : (
              <CheckCircle className="h-5 w-5 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {files.length > 0 && files.some((_, i) => uploadProgress[i] !== "success") && (
          <button
            type="submit"
            disabled={uploading || files.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#34d266] to-[#2d7cf6] px-4 py-3 font-medium text-white shadow-[0_18px_45px_rgba(52,210,102,0.18)] transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-white/35"
          >
            {uploading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Uploading {Object.values(uploadProgress).filter((p) => p === "uploading").length}
                /{files.length}...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Upload {files.length} File{files.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        )}
      </form>

      {editingSongIndex !== null && uploadedSongs[editingSongIndex] && (
        <EditSongModal
          song={uploadedSongs[editingSongIndex]}
          onClose={() => setEditingSongIndex(null)}
          onSave={(updatedSong) => handleSongUpdated(editingSongIndex, updatedSong)}
        />
      )}
    </div>
  );
}
