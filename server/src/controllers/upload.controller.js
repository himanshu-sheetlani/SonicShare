const { db } = require("../utils/firebase");
const jsmediatags = require("jsmediatags");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("../utils/cloudinary");

// Extract metadata from audio file buffer
const getMetadata = (fileBuffer) => {
  return new Promise((resolve) => {
    jsmediatags.read(fileBuffer, {
      onSuccess: (tag) => {
        const tags = tag.tags;
        let albumArt = null;

        // Extract album art
        if (tags.picture) {
          try {
            const picture = tags.picture;
            const base64String = btoa(
              String.fromCharCode.apply(null, picture.data)
            );
            albumArt = `data:${picture.format};base64,${base64String}`;
          } catch (err) {
            console.warn(`Error processing album art:`, err.message);
          }
        }

        resolve({
          title: tags.title || "Unknown Title",
          artist: tags.artist || "Unknown Artist",
          album: tags.album || "Unknown Album",
          genre: tags.genre || "Unknown Genre",
          albumArt: albumArt,
          duration: tags.length || 0,
        });
      },
      onError: (error) => {
        console.warn("Error reading tags:", error.message);
        resolve({
          title: "Unknown Title",
          artist: "Unknown Artist",
          album: "Unknown Album",
          genre: "Unknown Genre",
          albumArt: null,
          duration: 0,
        });
      },
    });
  });
};

// Upload song to Cloudinary and save metadata to Firestore
exports.uploadSong = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { title, artist, genre } = req.body;
    const file = req.file;

    // Validate file type
    const allowedMimeTypes = ["audio/mpeg", "audio/wav", "audio/mp3"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: "Only audio files are allowed" });
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({ error: "File size exceeds 50MB limit" });
    }

    console.log(`Uploading file: ${file.originalname}`);

    // Extract metadata from file buffer
    const metadata = await getMetadata(file.buffer);

    // Use provided title/artist or fall back to extracted metadata
    const songData = {
      title: title || metadata.title,
      artist: artist || metadata.artist,
      album: metadata.album,
      genre: genre || metadata.genre,
      albumArt: metadata.albumArt,
      duration: metadata.duration,
      uploadedAt: new Date().toISOString(),
      fileName: `${uuidv4()}-${file.originalname}`,
    };

    // Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video", // Cloudinary treats audio as video resource
        public_id: songData.fileName.split(".")[0],
        folder: "sonicshare/songs",
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Failed to upload file to Cloudinary" });
        }

        try {
          // Save song metadata to Firestore along with Cloudinary URL
          const docRef = await db.collection("songs").add({
            ...songData,
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id,
          });

          console.log(`Song uploaded successfully: ${docRef.id}`);

          return res.status(201).json({
            id: docRef.id,
            ...songData,
            cloudinaryUrl: result.secure_url,
            streamUrl: result.secure_url,
          });
        } catch (error) {
          console.error("Firestore save error:", error);
          return res.status(500).json({ error: "Failed to save song metadata" });
        }
      }
    );

    // Write file buffer to Cloudinary upload stream
    uploadStream.end(file.buffer);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed", details: error.message });
  }
};

// Get all songs from Firestore
exports.getSongsFromFirestore = async (req, res) => {
  try {
    const snapshot = await db.collection("songs").get();

    if (snapshot.empty) {
      return res.json([]);
    }

    const songs = [];
    snapshot.forEach((doc) => {
      songs.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(songs);
  } catch (error) {
    console.error("Error fetching songs:", error);
    res.status(500).json({ error: "Failed to fetch songs" });
  }
};

// Delete song from Firestore and Cloudinary
exports.deleteSong = async (req, res) => {
  try {
    const { songId } = req.params;

    if (!songId) {
      return res.status(400).json({ error: "Song ID is required" });
    }

    // Get song document to find Cloudinary public ID
    const songDoc = await db.collection("songs").doc(songId).get();

    if (!songDoc.exists) {
      return res.status(404).json({ error: "Song not found" });
    }

    const songData = songDoc.data();

    // Delete from Cloudinary
    if (songData.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(songData.cloudinaryPublicId, {
        resource_type: "video",
      });
    }

    // Delete from Firestore
    await db.collection("songs").doc(songId).delete();

    res.json({ message: "Song deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete song" });
  }
};
