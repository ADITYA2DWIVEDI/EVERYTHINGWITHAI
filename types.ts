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

export interface Message {
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
