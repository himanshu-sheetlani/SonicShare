import React, { useState } from "react";
import {
  Upload,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  Edit2,
  Edit2Icon,
} from "lucide-react";
import { uploadSongToFirestore } from "../utils/firestoreService";
import EditSongModal from "./EditSongModal";

// Component for bulk uploading songs to Cloudinary via backend API
export default function SongUploadForm({ onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedSongs, setUploadedSongs] = useState({}); // Map of index -> song data
  const [message, setMessage] = useState({ text: "", type: "" });
  const [editingSongIndex, setEditingSongIndex] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      // Only add audio files
      const audioFiles = selectedFiles.filter((f) =>
        f.type.startsWith("audio/"),
      );
      setFiles((prev) => [...prev, ...audioFiles]);
      setMessage({ text: "", type: "" });
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    const newUploaded = { ...uploadedSongs };
    delete newUploaded[index];
    setUploadedSongs(newUploaded);
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

    for (let i = 0; i < files.length; i++) {
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
        successCount++;
      } catch (error) {
        progress[i] = "error";
        errorCount++;
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Upload className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold">Upload Songs</h2>
      </div>

      <form onSubmit={handleUpload} className="space-y-5">
        {/* File Upload Area */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-400 block">
            Select Audio Files
          </label>
          <div className="relative border-2 border-dashed border-neutral-800 rounded-xl px-4 py-12 text-center hover:border-neutral-700 transition-colors bg-neutral-950 cursor-pointer">
            <input
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
              <Upload className="w-10 h-10 text-neutral-500" />
              <span className="font-medium text-neutral-300">
                Click to browse or drag & drop
              </span>
              <span className="text-xs text-neutral-500">
                MP3, WAV • Max 50MB per file
              </span>
            </div>
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-400">
                Selected Files ({files.length})
              </label>
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  setUploadedSongs({});
                }}
                className="text-xs text-neutral-500 hover:text-neutral-400 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-200 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>

                  {uploadProgress[index] ? (
                    <div className="flex items-center gap-2 shrink-0">
                      {uploadProgress[index] === "uploading" && (
                        <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                      )}
                      {uploadProgress[index] === "success" && (
                        <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                      )}
                      {uploadProgress[index] === "error" && (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        disabled={uploading}
                        className="text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSongIndex(index)}
                        disabled={uploading}
                        className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-neutral-900 rounded transition-colors disabled:opacity-50"
                        title="Edit metadata"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Message */}
        {message.text && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
              message.type === "error"
                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                : "bg-green-500/10 text-green-400 border border-green-500/20"
            }`}
          >
            {message.type === "error" ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && files.some((_, i) => uploadProgress[i] !== "success") && (
          <button
n            type="submit"
            disabled={uploading || files.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Uploading{" "}
                {
                  Object.values(uploadProgress).filter((p) => p === "uploading")
                    .length
                }
                /{files.length}...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload {files.length} File{files.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        )}
      </form>

      {/* Edit Modal for uploaded song */}
      {editingSongIndex !== null && uploadedSongs[editingSongIndex] && (
        <EditSongModal
          song={uploadedSongs[editingSongIndex]}
          onClose={() => setEditingSongIndex(null)}
          onSave={(updatedSong) =>
            handleSongUpdated(editingSongIndex, updatedSong)
          }
        />
      )}
    </div>
  );
}
