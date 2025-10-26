export interface Source {
  uri: string;
  title: string;
}

export interface ImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

// Renamed from 'Message' to be more specific to chat contexts
export interface ConversationMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string; // For displaying user-uploaded images in the UI
  sources?: Source[];
}

export interface User {
  email: string;
  isGuest: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
}

export interface VideoHistoryItem {
  id: string;
  prompt: string;
  videoUrl: string;
  timestamp: number;
}
