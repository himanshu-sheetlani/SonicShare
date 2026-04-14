# SonicShare

<p align="center">
  <img src="./client/public/SonicShare_logo-TransparentBG.png" alt="SonicShare Logo" width="250" />
</p>

<p align="center">
  <strong>A real-time synchronized music sharing web application.</strong>
</p>

## Overview

SonicShare is a modern web application that allows you and your friends to listen to music together in real-time. By utilizing built-in WebRTC connections, the application successfully synchronizes music playback, play/pause commands, and playlists across all connected peers within a "room". Users can upload songs via the Admin panel, build up collections, and seamlessly stream them together.

## 🌟 Features

- **Real-Time Synchronized Playback:** Listen to the same song at the exact same timestamp with your peers. Adjustments to play, pause, seek, Skip, or adding to queue are synchronized instantly via WebRTC data channels.
- **Room System:** Create listening rooms and invite others. The room state is maintained seamlessly, and WebRTC signaling automatically scales the host's connections.
- **Admin Library Management:** An exclusive Admin UI for uploading new songs, automatically parsing media tags, and storing files reliably.
- **Cloud Storage Integration:** Built using Firebase Cloud Storage / Cloudinary to handle streaming scalable audio.

## 🛠️ Tech Stack

### Client
- **React 19** & **Vite**: Fast development phase and highly responsive frontend.
- **Tailwind CSS v4**: Utility-first CSS framework for clean, modern styling.
- **Zustand**: Fast and scalable state management.
- **WebRTC**: Peer-to-peer data channels for ultra-low latency playback synchronization.

### Server
- **Express**: Robust Node.js REST API for managing rooms and signaling.
- **Firebase Admin**: Secure interactions with Firestore (database) and Firebase Cloud Storage.
- **Multer**: Handling multi-part song uploads (up to 50MB).

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) installed on your machine
- A [Firebase](https://firebase.google.com/) Project for Database and Storage

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd music
```

### 2. Setup the Server (Backend)

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` folder with your required secrets (like Firebase service account credentials and PORT configuration).

Start the backend server:

```bash
npm run dev
```
*(assuming a dev script is configured, or use `node server.js` / `nodemon`)*

### 3. Setup the Client (Frontend)

Open a new terminal session, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

Start the Vite development server:

```bash
npm run dev
```

### 4. Play Music

1. Open up `http://localhost:5173` in your browser.
2. Join a room or create a new one.
3. Use the admin interface to upload songs if the library is empty.
4. Enjoy listening together!

## 📄 License

This project is open-source and available under the ISC License.
