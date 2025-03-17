import SpotifyWebApi from 'spotify-web-api-node';
import { AtmosphereSettings } from '../types';

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

/**
 * Set access token for Spotify API requests
 */
export const setAccessToken = (token: string) => {
  spotifyApi.setAccessToken(token);
};

/**
 * Get current user's profile
 */
export const getCurrentUser = async () => {
  try {
    const response = await spotifyApi.getMe();
    return response.body;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

/**
 * Search for tracks on Spotify
 */
export const searchTracks = async (query: string, limit = 20) => {
  try {
    const response = await spotifyApi.searchTracks(query, { limit });
    return response.body.tracks?.items || [];
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
};

/**
 * Get track details by ID
 */
export const getTrack = async (trackId: string) => {
  try {
    const response = await spotifyApi.getTrack(trackId);
    return response.body;
  } catch (error) {
    console.error(`Error getting track ${trackId}:`, error);
    throw error;
  }
};

/**
 * Get multiple tracks by IDs
 */
export const getTracks = async (trackIds: string[]) => {
  try {
    const response = await spotifyApi.getTracks(trackIds);
    return response.body.tracks;
  } catch (error) {
    console.error('Error getting multiple tracks:', error);
    throw error;
  }
};

/**
 * Create a new playlist
 */
export const createPlaylist = async (userId: string, name: string, description: string, isPublic = true) => {
  try {
    const response = await spotifyApi.createPlaylist(name, {
      description,
      public: isPublic
    });
    return response.body;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

/**
 * Add tracks to a playlist
 */
export const addTracksToPlaylist = async (playlistId: string, trackUris: string[]) => {
  try {
    const response = await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
    return response.body;
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    throw error;
  }
};

/**
 * Get a user's playlists
 */
export const getUserPlaylists = async (userId: string, limit = 50) => {
  try {
    const response = await spotifyApi.getUserPlaylists(userId, { limit });
    return response.body.items;
  } catch (error) {
    console.error('Error getting user playlists:', error);
    throw error;
  }
};

/**
 * Get a playlist by ID
 */
export const getPlaylist = async (playlistId: string) => {
  try {
    const response = await spotifyApi.getPlaylist(playlistId);
    return response.body;
  } catch (error) {
    console.error(`Error getting playlist ${playlistId}:`, error);
    throw error;
  }
};

/**
 * Get recommendations based on seed tracks, artists, and genres
 */
export const getRecommendations = async (
  seedTracks: string[] = [],
  seedArtists: string[] = [],
  seedGenres: string[] = [],
  options: {
    limit?: number;
    min_energy?: number;
    max_energy?: number;
    min_tempo?: number;
    max_tempo?: number;
    min_valence?: number;
    max_valence?: number;
    min_instrumentalness?: number;
    max_instrumentalness?: number;
  } = {}
) => {
  try {
    const params = {
      seed_tracks: seedTracks.slice(0, 5 - (seedArtists.length + seedGenres.length)),
      seed_artists: seedArtists.slice(0, 5 - (seedTracks.length + seedGenres.length)),
      seed_genres: seedGenres.slice(0, 5 - (seedTracks.length + seedArtists.length)),
      limit: options.limit || 20,
      ...options,
    };

    // Ensure we don't exceed 5 total seeds
    const totalSeeds = params.seed_tracks.length + params.seed_artists.length + params.seed_genres.length;
    if (totalSeeds > 5) {
      console.warn('Too many seeds provided. Spotify allows a maximum of 5 seeds total.');
      // Adjust seeds to fit within the 5 seed limit
      if (params.seed_tracks.length > 0) {
        params.seed_tracks = params.seed_tracks.slice(0, Math.max(1, 5 - params.seed_artists.length - params.seed_genres.length));
      }
      if (params.seed_artists.length > 0 && totalSeeds > 5) {
        params.seed_artists = params.seed_artists.slice(0, Math.max(1, 5 - params.seed_tracks.length - params.seed_genres.length));
      }
      if (params.seed_genres.length > 0 && totalSeeds > 5) {
        params.seed_genres = params.seed_genres.slice(0, Math.max(1, 5 - params.seed_tracks.length - params.seed_artists.length));
      }
    }

    const response = await spotifyApi.getRecommendations(params);
    return response.body.tracks;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
};

/**
 * Get available genres for recommendations
 */
export const getAvailableGenres = async () => {
  try {
    const response = await spotifyApi.getAvailableGenreSeeds();
    return response.body.genres;
  } catch (error) {
    console.error('Error getting available genres:', error);
    throw error;
  }
};

/**
 * Convert atmosphere settings to Spotify recommendation parameters
 */
export const atmosphereToRecommendationParams = (atmosphere: AtmosphereSettings) => {
  // Map atmosphere settings to Spotify API parameters
  const params: Record<string, number> = {};
  
  // Map tempo (0-100) to Spotify tempo range (40-200 BPM)
  const minTempo = 40 + (atmosphere.tempo / 100) * 80;
  const maxTempo = minTempo + 30;
  params.min_tempo = minTempo;
  params.max_tempo = maxTempo;
  
  // Map energy (0-100) to Spotify energy parameter (0-1)
  const energy = atmosphere.energy / 100;
  params.min_energy = Math.max(0, energy - 0.2);
  params.max_energy = Math.min(1, energy + 0.2);
  
  // Map complexity to Spotify parameters
  // Higher complexity = higher instrumentalness
  const instrumentalness = atmosphere.complexity / 200; // Scale to 0-0.5 range
  params.min_instrumentalness = Math.max(0, instrumentalness - 0.1);
  params.max_instrumentalness = Math.min(1, instrumentalness + 0.1);
  
  // Map mood to valence (happiness parameter)
  let valence = 0.5; // Default neutral
  switch (atmosphere.mood) {
    case 'happy':
      valence = 0.8;
      break;
    case 'sad':
      valence = 0.2;
      break;
    case 'tense':
      valence = 0.3;
      params.min_energy = 0.7; // Tense music is energetic
      break;
    case 'relaxed':
      valence = 0.6;
      params.max_energy = 0.4; // Relaxed music is less energetic
      break;
    case 'epic':
      params.min_energy = 0.8; // Epic music is very energetic
      break;
    case 'mysterious':
      valence = 0.4;
      params.min_instrumentalness = 0.4; // Mysterious music often more instrumental
      break;
  }
  
  params.min_valence = Math.max(0, valence - 0.2);
  params.max_valence = Math.min(1, valence + 0.2);
  
  return params;
}; 