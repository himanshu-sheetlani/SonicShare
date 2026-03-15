import { create } from 'zustand';

export const useStore = create((set) => ({
  roomId: null,
  setRoomId: (id) => set({ roomId: id }),
  roomState: null,
  // Accept either an object or an updater function (prev => newState)
  setRoomState: (stateOrUpdater) => set((s) => ({
    roomState: typeof stateOrUpdater === 'function' ? stateOrUpdater(s.roomState) : stateOrUpdater
  })),
  userId: null, 
  setUserId: (id) => set({ userId: id }),
  currentPage: 'landing',
  setCurrentPage: (page) => set({ currentPage: page }),
}));
