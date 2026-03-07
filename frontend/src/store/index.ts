import { create } from 'zustand';
import { auth } from '../firebase.config';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  token?: string;
  color?: string; // Hex color for collaboration
}

interface SpreadsheetState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string | null) => void;
  logout: () => void;
  cells: Record<string, string>;
  setCell: (id: string, value: string) => void;
  setCells: (cells: Record<string, string>) => void;
  isSaving: boolean;
  setIsSaving: (val: boolean) => void;
  docTitle: string;
  setDocTitle: (title: string) => void;
  collaborators: Record<string, User>;
  setCollaborators: (users: Record<string, User>) => void;
  formatting: Record<string, any>;
  setFormat: (cellId: string, format: any) => void;
  setAllFormatting: (formatting: Record<string, any>) => void;
  columnWidths: Record<number, number>;
  rowHeights: Record<number, number>;
  setColumnWidth: (colIndex: number, width: number) => void;
  setRowHeight: (rowIndex: number, height: number) => void;
  setAllLayout: (columnWidths: Record<number, number>, rowHeights: Record<number, number>) => void;
  columnOrder: number[];
  rowOrder: number[];
  setColumnOrder: (order: number[]) => void;
  setRowOrder: (order: number[]) => void;
  setAllOrder: (columnOrder: number[], rowOrder: number[]) => void;
  syncGoogleUser: (firebaseUser: any) => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getInitialAuth = () => {
  try {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) return JSON.parse(savedAuth);
  } catch (error) {
    console.error('Failed to parse auth from localStorage:', error);
    localStorage.removeItem('auth');
  }
  return { user: null, token: null };
};

const initialAuth = getInitialAuth();

export const useStore = create<SpreadsheetState>((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  setAuth: (user, token) => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    if (!user.color) {
      user.color = colors[Math.floor(Math.random() * colors.length)];
    }
    localStorage.setItem('auth', JSON.stringify({ user, token }));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('auth');
    auth.signOut().catch(console.error);
    set({ user: null, token: null });
  },
  cells: {},
  setCell: (id, value) => set((state) => ({ cells: { ...state.cells, [id]: value } })),
  setCells: (cells) => set({ cells }),
  isSaving: false,
  setIsSaving: (val) => set({ isSaving: val }),
  docTitle: 'Untitled Spreadsheet',
  setDocTitle: (title) => set({ docTitle: title }),
  collaborators: {},
  setCollaborators: (users) => set({ collaborators: users }),
  formatting: {},
  setFormat: (cellId, format) => set((state) => ({ 
    formatting: { 
      ...state.formatting, 
      [cellId]: { ...(state.formatting[cellId] || {}), ...format } 
    } 
  })),
  setAllFormatting: (formatting) => set({ formatting }),
  columnWidths: {},
  rowHeights: {},
  setColumnWidth: (colIndex, width) => set((state) => ({ 
    columnWidths: { ...state.columnWidths, [colIndex]: width } 
  })),
  setRowHeight: (rowIndex, height) => set((state) => ({ 
    rowHeights: { ...state.rowHeights, [rowIndex]: height } 
  })),
  setAllLayout: (columnWidths, rowHeights) => set({ columnWidths, rowHeights }),
  columnOrder: [],
  rowOrder: [],
  setColumnOrder: (order) => set({ columnOrder: order }),
  setRowOrder: (order) => set({ rowOrder: order }),
  setAllOrder: (columnOrder, rowOrder) => set({ columnOrder, rowOrder }),
  syncGoogleUser: async (firebaseUser) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/google-login`, {
        name: firebaseUser.displayName || 'Anonymous User',
        email: firebaseUser.email || '',
      });
      const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
      const user = { ...data };
      if (!user.color) {
        user.color = colors[Math.floor(Math.random() * colors.length)];
      }
      localStorage.setItem('auth', JSON.stringify({ user, token: data.token }));
      set({ user, token: data.token });
    } catch (error) {
      console.error('Store sync error:', error);
      throw error;
    }
  },
}));
