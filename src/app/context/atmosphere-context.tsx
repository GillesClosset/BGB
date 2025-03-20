'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AtmosphereSettings, BoardGame, SearchResult, SpotifyTrack } from '../types';

interface AtmosphereContextType {
  // Game data
  selectedGame: BoardGame | null;
  searchResult: SearchResult | null;
  setSelectedGame: (game: BoardGame | null) => void;
  setSearchResult: (result: SearchResult | null) => void;
  
  // Genres
  selectedGenres: string[];
  updateSelectedGenres: (genres: string[]) => void;
  
  // Keywords
  aiKeywords: string[];
  selectedKeywords: string[];
  updateSelectedKeywords: (keywords: string[]) => void;
  
  // Track count
  trackCount: number;
  updateTrackCount: (count: number) => void;
  
  // AI suggestions tracking
  aiSuggestedGenres: string[];
  setAiSuggestions: (genres: string[], keywords?: string[], explanation?: string) => void;
  
  // AI explanation
  aiExplanation: string | null;
  
  // Spotify search results
  spotifyTracks: SpotifyTrack[];
  updateSpotifyTracks: (tracks: SpotifyTrack[]) => void;
  addSpotifyTracks: (tracks: SpotifyTrack[]) => void;
  clearSpotifyTracks: () => void;
  
  // Active search type (genres or keywords)
  activeSearchType: 'genres' | 'keywords';
  setActiveSearchType: (type: 'genres' | 'keywords') => void;
  
  // Mood
  mood: string;
  updateMood: (mood: string) => void;
  
  // Reset all
  resetAtmosphere: () => void;
}

const AtmosphereContext = createContext<AtmosphereContextType | undefined>(undefined);

export function AtmosphereProvider({ children }: { children: ReactNode }) {
  // Game data
  const [selectedGame, setSelectedGame] = useState<BoardGame | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  
  // Genres
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  
  // Keywords
  const [aiKeywords, setAiKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  
  // Track count
  const [trackCount, setTrackCount] = useState<number>(10);
  
  // AI suggestions tracking
  const [aiSuggestedGenres, setAiSuggestedGenres] = useState<string[]>([]);
  
  // AI explanation
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  
  // Spotify search results
  const [spotifyTracks, setSpotifyTracks] = useState<SpotifyTrack[]>([]);
  
  // Active search type
  const [activeSearchType, setActiveSearchType] = useState<'genres' | 'keywords'>('genres');
  
  // Mood
  const [mood, setMood] = useState<string>('neutral');

  // Reset everything
  const resetAtmosphere = useCallback(() => {
    setSelectedGenres([]);
    setSelectedKeywords([]);
    setTrackCount(10);
    setAiSuggestedGenres([]);
    setAiKeywords([]);
    setAiExplanation(null);
    setSpotifyTracks([]);
    setMood('neutral');
    setActiveSearchType('genres');
  }, []);

  // Custom setter for selectedGame that also resets atmosphere state
  const setGameWithReset = useCallback((game: BoardGame | null) => {
    // If the game is different from the current one, reset atmosphere data
    if (game?.id !== selectedGame?.id) {
      resetAtmosphere();
    }
    setSelectedGame(game);
  }, [selectedGame, resetAtmosphere]);
  
  // Update selected genres
  const updateSelectedGenres = useCallback((genres: string[]) => {
    setSelectedGenres(genres);
  }, []);

  // Update selected keywords
  const updateSelectedKeywords = useCallback((keywords: string[]) => {
    setSelectedKeywords(keywords);
  }, []);

  // Update track count
  const updateTrackCount = useCallback((count: number) => {
    setTrackCount(count);
  }, []);

  // Set AI suggestions
  const setAiSuggestions = useCallback((genres: string[], keywords: string[] = [], explanation?: string) => {
    // Update AI suggested genres
    setAiSuggestedGenres(genres);
    
    // Update AI keywords
    setAiKeywords(keywords);
    
    // Update AI explanation if provided
    if (explanation) {
      setAiExplanation(explanation);
    }
    
    // If no genres are selected yet, use the AI suggestions
    if (selectedGenres.length === 0) {
      setSelectedGenres(genres.slice(0, 5)); // Limit to 5 genres
    }
    
    // If no keywords are selected yet, use the AI suggestions
    if (selectedKeywords.length === 0 && keywords.length > 0) {
      setSelectedKeywords(keywords.slice(0, 5)); // Limit to 5 keywords
    }
  }, [selectedGenres, selectedKeywords]);

  // Update mood
  const updateMood = useCallback((newMood: string) => {
    setMood(newMood);
  }, []);

  // Update spotify tracks
  const updateSpotifyTracks = useCallback((tracks: SpotifyTrack[]) => {
    setSpotifyTracks(tracks);
  }, []);

  // Add more spotify tracks
  const addSpotifyTracks = useCallback((tracks: SpotifyTrack[]) => {
    setSpotifyTracks(prevTracks => {
      // Create a map of existing track IDs for quick lookup
      const existingTrackIds = new Map(prevTracks.map(track => [track.id, true]));
      
      // Filter out duplicates from the new tracks
      const uniqueNewTracks = tracks.filter(track => !existingTrackIds.has(track.id));
      
      // Return the combined array of tracks
      return [...prevTracks, ...uniqueNewTracks];
    });
  }, []);

  // Clear spotify tracks
  const clearSpotifyTracks = useCallback(() => {
    setSpotifyTracks([]);
  }, []);

  return (
    <AtmosphereContext.Provider
      value={{
        selectedGame,
        searchResult,
        setSelectedGame: setGameWithReset,
        setSearchResult,
        selectedGenres,
        updateSelectedGenres,
        aiKeywords,
        selectedKeywords,
        updateSelectedKeywords,
        trackCount,
        updateTrackCount,
        aiSuggestedGenres,
        setAiSuggestions,
        aiExplanation,
        spotifyTracks,
        updateSpotifyTracks,
        addSpotifyTracks,
        clearSpotifyTracks,
        activeSearchType,
        setActiveSearchType,
        mood,
        updateMood,
        resetAtmosphere,
      }}
    >
      {children}
    </AtmosphereContext.Provider>
  );
}

export function useAtmosphere() {
  const context = useContext(AtmosphereContext);
  if (context === undefined) {
    throw new Error('useAtmosphere must be used within an AtmosphereProvider');
  }
  return context;
} 