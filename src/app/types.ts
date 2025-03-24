export interface AIResponse {
  genres: string[];
  keywords?: string[];
  explanation: string;
}

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
}

export interface SearchResult {
  games: BoardGame[];
  totalResults: number;
  page: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
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
  external_urls: {
    spotify: string;
  };
  preview_url?: string | null;
  popularity?: number;
}

export interface AtmosphereSettings {
  tempo: number;
  energy: number;
  complexity: number;
  mood: string;
  genres: string[];
  era: string;
} 