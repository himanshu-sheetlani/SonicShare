const fs = require("fs");
const path = require("path");
const jsmediatags = require("jsmediatags");

const songsDir = path.join(__dirname, "../../public/songs");

// Get metadata using jsmediatags
const getMetadata = (filePath) => {
  return new Promise((resolve) => {
    jsmediatags.read(filePath, {
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
          title: tags.title || null,
          artist: tags.artist || null,
          album: tags.album || null,
          albumArt: albumArt,
          duration: tags.length || 0,
        });
      },
      onError: (error) => {
        console.warn("Error reading tags:", error.message);
        resolve({
          title: null,
          artist: null,
          album: null,
          albumArt: null,
          duration: 0,
        });
      },
    });
  });
};

// Get all songs from public/songs folder with metadata
const getSongs = async (req, res) => {
  try {
    // Create songs directory if it doesn't exist
    if (!fs.existsSync(songsDir)) {
      fs.mkdirSync(songsDir, { recursive: true });
    }

    const files = fs.readdirSync(songsDir);
    
    // Filter only audio files
    const audioExtensions = [".mp3", ".wav", ".flac", ".m4a"];
    const audioFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return audioExtensions.includes(ext);
    });

    // Get file details with metadata
    const songs = await Promise.all(
      audioFiles.map(async (file) => {
        const filePath = path.join(songsDir, file);
        const stats = fs.statSync(filePath);
        
        const metadata = await getMetadata(filePath);

        return {
          id: file,
          fileName: file,
          fileSize: stats.size,
          url: `/songs/${file}`,
          uploadedAt: stats.birthtime,
          title: metadata.title || file.replace(/\.[^/.]+$/, ""),
          artist: metadata.artist || "Unknown Artist",
          album: metadata.album || "Unknown Album",
          albumArt: metadata.albumArt,
          duration: metadata.duration || 0,
        };
      })
    );

    res.status(200).json({
      message: "Songs retrieved successfully",
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("Error retrieving songs:", error);
    res.status(500).json({
      error: error.message || "Internal server error retrieving songs",
    });
  }
};

// Play a specific song
const playSong = async (req, res) => {
  try {
    const { fileName } = req.params;

    // Validate fileName to prevent directory traversal
    if (fileName.includes("..") || fileName.includes("/")) {
      return res.status(400).json({ error: "Invalid file name" });
    }

    const filePath = path.join(songsDir, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Song not found" });
    }

    // Get file extension to determine MIME type
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".flac": "audio/flac",
      ".m4a": "audio/mp4",
    };

    const mimeType = mimeTypes[ext] || "audio/mpeg";

    // Set response headers
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Accept-Ranges", "bytes");

    // Get file size
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Handle range requests for streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Content-Length", chunksize);
      res.status(206);

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      res.setHeader("Content-Length", fileSize);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error("Error playing song:", error);
    res.status(500).json({
      error: error.message || "Internal server error playing song",
    });
  }
};

module.exports = {
  getSongs,
  playSong,
};
