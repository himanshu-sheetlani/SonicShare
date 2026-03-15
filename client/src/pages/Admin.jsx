import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { LogOut, Loader, ArrowLeft } from "lucide-react";
import { useStore } from "../store";

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
        <div className="mb-6">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-16 h-16 rounded-full mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold">{user.displayName}</h1>
          <p className="text-neutral-400 text-sm">{user.email}</p>
        </div>

        <p className="text-neutral-400 mb-8">
          Welcome to the admin panel.
        </p>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
