/**
 * AI Chat Service
 * Handles communication with the AI chatbot backend
 */

import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  timestamp: string;
  has_health_context: boolean;
  error?: string;
}

export interface ConversationHistoryResponse {
  messages: ChatMessage[];
  total: number;
}

/**
 * Get authorization header
 */
const getAuthHeader = () => {
  const token = Cookies.get('access_token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Ask a question to the AI chatbot
 */
export const askQuestion = async (
  message: string,
  conversationHistory?: ChatMessage[]
): Promise<ChatResponse> => {
  try {
    const response = await axios.post<ChatResponse>(
      `${API_BASE_URL}/api/v1/chat/ask`,
      {
        message,
        conversation_history: conversationHistory?.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      },
      {
        headers: getAuthHeader(),
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error asking question:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get conversation history
 */
export const getConversationHistory = async (
  limit: number = 50
): Promise<ConversationHistoryResponse> => {
  try {
    const response = await axios.get<ConversationHistoryResponse>(
      `${API_BASE_URL}/api/v1/chat/history`,
      {
        headers: getAuthHeader(),
        params: { limit },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching conversation history:', error);
    throw error.response?.data || error;
  }
};

/**
 * Clear conversation history
 */
export const clearConversationHistory = async (): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/api/v1/chat/history`, {
      headers: getAuthHeader(),
    });
  } catch (error: any) {
    console.error('Error clearing conversation history:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get suggested questions
 */
export const getSuggestions = async (): Promise<string[]> => {
  try {
    const response = await axios.get<{ suggestions: string[] }>(
      `${API_BASE_URL}/api/v1/chat/suggestions`,
      {
        headers: getAuthHeader(),
      }
    );

    return response.data.suggestions;
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    return [
      'What do my recent lab results mean?',
      'How has my health changed over time?',
      'What should I know about my health metrics?',
    ];
  }
};

/**
 * Check if chat service is available
 */
export const checkChatHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/chat/health-check`);
    return response.data.gemini_configured === true;
  } catch (error) {
    console.error('Chat service health check failed:', error);
    return false;
  }
};
