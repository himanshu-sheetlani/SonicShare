import { useState } from 'react';
import { ArrowRight, Lock, Music2, Plus, Radio, Users } from 'lucide-react';
import { socket } from '../socket';
import { useStore } from '../store';

const navItems = ['Home', 'Category', 'Pricing', 'FAQ', 'Contact Us'];

export function LandingPage({ error }) {
  const [inputRoomId, setInputRoomId] = useState('');
  const { setCurrentPage } = useStore();

  const handleCreate = () => {
    socket.emit('create-room');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputRoomId.trim()) {
      socket.emit('join-room', inputRoomId.trim());
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(36,110,255,0.28),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(49,180,113,0.14),_transparent_26%),linear-gradient(180deg,_#101c31_0%,_#09111d_58%,_#07111f_100%)]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(120deg,transparent_0%,rgba(80,121,255,0.12)_32%,transparent_48%),linear-gradient(240deg,transparent_0%,rgba(46,213,115,0.08)_28%,transparent_45%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[55vh] bg-[radial-gradient(circle_at_center,_rgba(63,255,147,0.2),_transparent_48%)] blur-3xl" />
      <div
        className="absolute inset-0 z-0 bg-cover bg-bottom bg-no-repeat"
        style={{ backgroundImage: "url('/bg_image.webp')" }}
      />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.08)_0%,rgba(7,17,31,0.03)_42%,rgba(7,17,31,0.64)_82%,rgba(7,17,31,0.9)_100%)]" />

      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-14">
        <div className="flex items-center gap-3">
          <img
            src="/SonicShare_logo-TransparentBG.png"
            alt="SonicShare"
            className="h-10 w-10 rounded-xl object-contain"
          />
          <span className="text-2xl font-semibold tracking-tight">SonicShare</span>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-white/80 xl:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className="transition hover:text-white"
              onClick={(e) => e.preventDefault()}
            >
              {item}
            </a>
          ))}
        </nav>
      </header>

      <main className="relative z-10 flex h-[calc(100vh-92px)] flex-col items-center px-5 pb-[11rem] pt-6 text-center sm:px-8 md:pt-10 lg:px-14 lg:pb-[13rem]">
        <div className="max-w-5xl">

          <h1 className="mx-auto max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl lg:text-[6.2rem]">
            Epic Music
            <br />
            Experience
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-lg">
            We have the perfect music with free licensing for your creativity.
            Discover the possibilities now with live shared rooms, synced playback,
            and instant invites.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={handleCreate}
              className="inline-flex min-w-[200px] items-center justify-center gap-3 rounded-2xl bg-[#34d266] px-7 py-3.5 text-base font-semibold text-white shadow-[0_18px_45px_rgba(52,210,102,0.28)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <Plus size={20} />
              Start Free Now
            </button>

            <form
              onSubmit={handleJoin}
              className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/12 bg-[#08101d]/80 p-2 backdrop-blur-xl"
            >
              <input
                id="roomId"
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="w-full bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/35 sm:text-base"
              />
              <button
                type="submit"
                disabled={!inputRoomId.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/72">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <Users size={15} className="text-[#56e084]" />
              Group listening
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <Music2 size={15} className="text-[#56e084]" />
              Shared playlists
            </div>
            <button
              onClick={() => setCurrentPage('admin')}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/72 backdrop-blur transition hover:text-white"
            >
              <Lock size={15} className="text-[#56e084]" />
              Admin panel
            </button>
          </div>

          {error && (
            <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm text-red-100 backdrop-blur">
              {error}
            </div>
          )}
        </div>
      </main>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-48 bg-gradient-to-t from-[#07111f] via-[#07111f]/60 to-transparent" />
    </div>
  );
}
