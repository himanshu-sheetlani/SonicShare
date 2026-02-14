import { create } from 'zustand';

export const useStore = create((set) => ({
  roomId: null,
  setRoomId: (id) => set({ roomId: id }),
  roomState: null,
  setRoomState: (state) => set({ roomState: state }),
  userId: null, 
  setUserId: (id) => set({ userId: id }),
}));
