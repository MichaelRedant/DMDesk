import { create } from 'zustand';
import { ChatMessage, FocusType, Mode, SourceRef } from '../types';

interface ChatState {
  messages: ChatMessage[];
  mode: Mode;
  isLoading: boolean;
  focus: FocusType;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'> & Partial<Pick<ChatMessage, 'id' | 'timestamp'>>) => void;
  addAssistantMessage: (content: string, sources?: SourceRef[]) => void;
  setMode: (mode: Mode) => void;
  setLoading: (loading: boolean) => void;
  setFocus: (focus: FocusType) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  mode: 'rules',
  isLoading: false,
  focus: 'general',
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: message.id ?? crypto.randomUUID(),
          timestamp: message.timestamp ?? Date.now(),
          role: message.role,
          content: message.content,
          sources: message.sources
        }
      ]
    })),
  addAssistantMessage: (content, sources) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          role: 'assistant',
          content,
          sources
        }
      ]
    })),
  setMode: (mode) => set({ mode }),
  setLoading: (isLoading) => set({ isLoading }),
  setFocus: (focus) => set({ focus }),
  clearChat: () => set({ messages: [] })
}));
