// Client-side utility for uploading songs to Firebase Cloud Storage via the API
export const uploadSongToFirestore = async (file, metadata = {}) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    if (metadata.title) formData.append("title", metadata.title);
    if (metadata.artist) formData.append("artist", metadata.artist);
    if (metadata.genre) formData.append("genre", metadata.genre);

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const song = await response.json();
    console.log("Song uploaded successfully:", song);
    return song;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

export const getSongsFromFirestore = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/firestore-songs`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch songs");
    }

    const songs = await response.json();
    return songs;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const deleteSongFromFirestore = async (songId) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/songs/${songId}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Delete failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
};
