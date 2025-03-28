// Spotify related types
export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
  product: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  uri: string;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  popularity: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string; height: number; width: number }[];
  tracks: {
    total: number;
    items: {
      track: SpotifyTrack;
    }[];
  };
  external_urls: {
    spotify: string;
  };
  uri: string;
}

// BoardGame related types
export interface BoardGame {
  id: string;
  name: string;
  description: string;
  image: string;
  year: number;
  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
  categories: string[];
  mechanics: string[];
  designer: string;
  publisher: string;
  rating: number;
  weight?: number; // complexity rating
  imageUrl?: string; // The URL for the game image
  yearPublished?: number; // The year the game was published
  stats?: {
    playingTime: number;
    minPlayers?: number;
    maxPlayers?: number;
    minPlayTime?: number;
    maxPlayTime?: number;
  };
}

// Search result type (simplified version used in SearchBar)
export interface SearchResult {
  id: string;
  name: string;
  yearPublished: number;
  image: string;
  description?: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
  min_playtime?: number;
  max_playtime?: number;
  year_published?: number;
  games?: any[];
  totalResults?: number;
  page?: number;
}

// Atmosphere related types
export interface AtmosphereSettings {
  tempo: number; // 0-100 (slow to fast)
  energy: number; // 0-100 (calm to energetic)
  complexity: number; // 0-100 (simple to complex)
  mood: string; // 'happy', 'tense', 'mysterious', 'epic', etc.
  genres: string[]; // Array of music genres
  era: string; // 'classical', '80s', 'modern', etc.
}

// AI related types
export interface AIPrompt {
  boardGame: BoardGame;
  atmosphere: AtmosphereSettings;
}

export interface AIResponse {
  genres: string[];
  keywords?: string[];
  retrievedGenres: string[];
  explanation?: string;
  audioFeatures?: {
    acousticness: number;
    danceability: number;
    energy: number;
    instrumentalness: number;
    liveness: number;
    speechiness: number;
    tempo: number;
    valence: number;
  };
}

// Session and auth types
export interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
}

// Extended next-auth session type
declare module "next-auth" {
  interface Session {
    user: SessionUser;
    error?: string;
  }
  
  interface User {
    id: string;
    accessToken: string;
    refreshToken: string;
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessToken: string;
    refreshToken: string;
    username: string;
    accessTokenExpires: number;
    error?: string;
  }
} 