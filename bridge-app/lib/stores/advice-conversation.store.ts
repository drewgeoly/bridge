/**
 * Zustand store for managing advice conversation state
 */

import { create } from 'zustand'

export type AdviceStep = 1 | 2 | 3 | 4 | 5

export interface ConversationContext {
  intent?: string
  friend?: {
    id?: string
    name: string
  }
  activity?: string
  userTextHistory: string[]
  adviceHistory: Array<{
    advice: string
    recommendations?: Array<{ type: string; data?: any }>
    timestamp: number
  }>
}

export interface AdviceConversationState {
  currentStep: AdviceStep
  conversationId?: string
  context: ConversationContext
  isStreaming: boolean
  streamingResponse: string
  
  // Actions
  setStep: (step: AdviceStep) => void
  setIntent: (intent: string) => void
  setFriend: (friend: { id?: string; name: string }) => void
  setActivity: (activity: string) => void
  addUserText: (text: string) => void
  addAdvice: (advice: string, recommendations?: Array<{ type: string; data?: any }>) => void
  setConversationId: (id: string) => void
  setStreaming: (isStreaming: boolean) => void
  setStreamingResponse: (response: string) => void
  reset: () => void
  loadConversation: (conversationId: string, context: ConversationContext) => void
}

const initialState = {
  currentStep: 1 as AdviceStep,
  conversationId: undefined,
  context: {
    intent: undefined,
    friend: undefined,
    activity: undefined,
    userTextHistory: [],
    adviceHistory: [],
  },
  isStreaming: false,
  streamingResponse: '',
}

export const useAdviceConversationStore = create<AdviceConversationState>()((set) => ({
  ...initialState,
  
  setStep: (step) => set({ currentStep: step }),
  
  setIntent: (intent) =>
    set((state) => ({
      context: { ...state.context, intent },
    })),
  
  setFriend: (friend) =>
    set((state) => ({
      context: { ...state.context, friend },
    })),
  
  setActivity: (activity) =>
    set((state) => ({
      context: { ...state.context, activity },
    })),
  
  addUserText: (text) =>
    set((state) => ({
      context: {
        ...state.context,
        userTextHistory: [...state.context.userTextHistory, text],
      },
    })),
  
  addAdvice: (advice, recommendations) =>
    set((state) => ({
      context: {
        ...state.context,
        adviceHistory: [
          ...state.context.adviceHistory,
          {
            advice,
            recommendations,
            timestamp: Date.now(),
          },
        ],
      },
    })),
  
  setConversationId: (id) => set({ conversationId: id }),
  
  setStreaming: (isStreaming) => set({ isStreaming }),
  
  setStreamingResponse: (response) => set({ streamingResponse: response }),
  
  reset: () => set(initialState),
  
  loadConversation: (conversationId, context) =>
    set({
      conversationId,
      context,
      currentStep: 4, // Load into advice output step
    }),
}))

