import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { LogOut, Loader, ArrowLeft } from "lucide-react";
import { useStore } from "../store";
import SongUploadForm from "../components/SongUploadForm";

export default function Admin() {
  const { setCurrentPage, setRoomId } = useStore();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        setCurrentPage('admin');
      }
    });
    return () => unsubscribe();
  }, [setCurrentPage]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
        <button
          onClick={() => {
            setRoomId(null);
            setCurrentPage('landing');
          }}
          className="absolute top-4 left-4 p-2 hover:bg-neutral-900 rounded-lg transition-colors text-neutral-400 hover:text-white"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl text-center">
          <h1 className="text-2xl font-bold mb-2">Admin Portal</h1>
          <p className="text-neutral-400 mb-8">
            Sign in with Google to access the admin panel.
          </p>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-neutral-900 font-semibold py-3 px-4 rounded-xl hover:bg-neutral-200 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09 0-.73.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.33 2.98-4.00 5.16-4.00z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header with Logo */}
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <img src="/SonicShare_logo-TransparentBG.png" alt="SonicShare" className="h-8 md:h-10 object-contain" />
            <span className="text-lg md:text-xl font-bold text-white">SonicShare Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        <button
          onClick={() => {
            setRoomId(null);
            setCurrentPage('landing');
          }}
          className="mb-8 p-2 hover:bg-neutral-900 rounded-lg transition-colors text-neutral-400 hover:text-white inline-flex items-center gap-2"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="max-w-3xl mx-auto">
          {/* User Info */}
          <div className="flex items-center justify-between mb-12 pb-6 border-b border-neutral-800">
            <div className="flex items-center gap-4">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold">{user.displayName}</h1>
                <p className="text-neutral-400 text-sm">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Upload Form */}
          <SongUploadForm />
        </div>
      </div>
    </div>
  );
}
