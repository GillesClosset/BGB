'use client';

import React, { useEffect, useCallback, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Divider,
  Button,
  useColorModeValue,
  Flex,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  Stack,
  Spinner,
  useToast,
  Icon,
  Badge,
  Center,
  keyframes,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { useAtmosphere } from '@/app/context/atmosphere-context';
import GenreSelector from '@/app/components/atmosphere/GenreSelector';
import KeywordSelector from '@/app/components/atmosphere/KeywordSelector';
import { SpotifyTrack } from '../types';
import { FaSpotify } from 'react-icons/fa';

// Function to randomize tracks
const randomizeTracks = (tracks: SpotifyTrack[], trackCount: number, sources: string[]): SpotifyTrack[] => {
  // If we don't have enough tracks, return all available tracks
  if (tracks.length <= trackCount) {
    return [...tracks];
  }
  
  // First, ensure we're working with a shuffled copy of the tracks for better variety
  const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
  
  // For smaller track counts, we can just return the first N shuffled tracks
  if (!sources || sources.length <= 1) {
    return shuffledTracks.slice(0, trackCount);
  }
  
  // For multiple sources, distribute tracks evenly
  const tracksBySource: Record<string, SpotifyTrack[]> = {};
  sources.forEach(source => { tracksBySource[source] = []; });
  
  // Group tracks by source
  shuffledTracks.forEach((track, index) => {
    const source = sources[index % sources.length];
    tracksBySource[source].push(track);
  });
  
  // Distribute tracks evenly from each source
  const tracksPerSource = Math.ceil(trackCount / sources.length);
  const selectedTracks: SpotifyTrack[] = [];
  
  sources.forEach(source => {
    const sourceTracks = tracksBySource[source].slice(0, tracksPerSource);
    selectedTracks.push(...sourceTracks);
  });
  
  // Final shuffle and trim to exactly the requested trackCount
  return selectedTracks
    .sort(() => Math.random() - 0.5)
    .slice(0, trackCount);
};

export default function AtmospherePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    selectedGame,
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
  } = useAtmosphere();

  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const toast = useToast();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const explanationTextColor = useColorModeValue('gray.600', 'gray.400');
  const gameTextColor = useColorModeValue('gray.600', 'gray.400');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');

  // Define the glowing animation keyframes
  const backgroundAnim = keyframes`
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  `;

  // Convert to string value for use in Chakra
  const backgroundAnimation = `${backgroundAnim} 15s ease infinite`;

  // Redirect to search if no game is selected
  useEffect(() => {
    if (!selectedGame) {
      router.push('/search');
    }
  }, [selectedGame, router]);

  // Check authentication status when component mounts
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in with Spotify to create playlists',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [status, toast]);

  // Reset playlist URL when relevant settings change
  useEffect(() => {
    // Reset the playlist URL whenever track count, search type, or tracks change
    // This ensures a new playlist will be created when settings change
    setPlaylistUrl(null);
  }, [trackCount, activeSearchType, selectedGenres, selectedKeywords]);

  // Handle Spotify sign in
  const handleSignIn = useCallback(async () => {
    try {
      await signIn('spotify', { callbackUrl: window.location.href });
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'Authentication Failed',
        description: 'Failed to sign in with Spotify. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Memoize the handlers to prevent unnecessary re-renders
  const handleSearchByGenres = useCallback(async (genres: string[], isAutoSearch = false) => {
    console.log('handleSearchByGenres called with genres:', genres, 'isAutoSearch:', isAutoSearch);
    
    // Prevent duplicate calls if already searching
    if (isSearching) {
      console.warn('Search already in progress, ignoring duplicate call');
      return;
    }
    
    if (!session?.user?.accessToken) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in with Spotify to search for music',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      handleSignIn();
      return;
    }

    // Safety check for empty genres array
    if (!genres || genres.length === 0) {
      console.warn('No genres provided to search function');
      toast({
        title: 'No genres selected',
        description: 'Please select at least one genre to search',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Show notification for larger playlists only if not auto-searching
    if (trackCount > 50 && !isAutoSearch) {
      toast({
        title: 'Creating a Large Playlist',
        description: `Fetching tracks for a ${trackCount}-track playlist. This may take a moment.`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }

    setIsSearching(true);
    setActiveSearchType('genres');
    clearSpotifyTracks();
    
    // Reset playlist URL when starting a new search
    setPlaylistUrl(null);

    try {
      console.log('Starting genre search for', genres.length, 'genres');
      let foundTracks = false;
      let allFetchedTracks: SpotifyTrack[] = [];
      
      // Create a local copy of the genres to avoid any potential issues
      const genresToSearch = [...genres];
      
      // Calculate tracks per genre based on trackCount
      // Significantly increase the multiplier for larger track counts
      // This is key to ensuring we get enough tracks for large playlists
      const multiplier = trackCount > 50 ? 5 : 3;
      const desiredTracksPerGenre = Math.ceil((trackCount * multiplier) / genresToSearch.length);
      
      // Ensure we get at least 20 tracks per genre for variety
      // BUT respect Spotify's API limit of 50 tracks per request
      const SPOTIFY_MAX_LIMIT = 50;
      const MIN_TRACKS_PER_GENRE = 20;
      
      console.log(`Aiming for ~${desiredTracksPerGenre} tracks per genre for a total target of ${trackCount} tracks`);
      
      for (const genre of genresToSearch) {
        console.log('Searching for genre:', genre);
        let totalTracksFetched = 0;
        let offset = 0;
        
        // Calculate how many tracks we need to fetch for this genre
        const tracksNeededForGenre = Math.max(desiredTracksPerGenre, MIN_TRACKS_PER_GENRE);
        
        // If we need more than 50 tracks, we'll need to make multiple requests with pagination
        // Increase the pagination depth for larger playlists
        const MAX_PAGINATION_DEPTH = trackCount > 50 ? 5 : 3;
        let paginationCount = 0;
        
        while (totalTracksFetched < tracksNeededForGenre && paginationCount < MAX_PAGINATION_DEPTH) {
          // For each request, fetch up to 50 tracks (Spotify's limit)
          const tracksToFetch = Math.min(SPOTIFY_MAX_LIMIT, tracksNeededForGenre - totalTracksFetched);
          
          console.log(`Fetching ${tracksToFetch} tracks for genre "${genre}" (offset: ${offset}, page ${paginationCount + 1}/${MAX_PAGINATION_DEPTH})`);
          paginationCount++;
          
          const response = await fetch(`/api/spotify?action=search&query=${encodeURIComponent(genre)}&limit=${tracksToFetch}&offset=${offset}`);
          const data = await response.json();
          
          if (response.ok && data.tracks && data.tracks.length > 0) {
            // Add these tracks to our results
            console.log(`Found ${data.tracks.length} tracks for genre: ${genre} (page ${offset/SPOTIFY_MAX_LIMIT + 1})`);
            // Instead of adding directly, collect all tracks
            allFetchedTracks = [...allFetchedTracks, ...data.tracks];
            foundTracks = true;
            
            // Update counters for pagination
            totalTracksFetched += data.tracks.length;
            offset += SPOTIFY_MAX_LIMIT;
            
            // If we got fewer tracks than requested, there are no more to fetch
            if (data.tracks.length < tracksToFetch) {
              console.log(`No more tracks available for genre: ${genre} after fetching ${totalTracksFetched} tracks`);
              break;
            }
          } else {
            // If we get an error or no tracks, stop trying for this genre
            if (!response.ok) {
              console.error(`Error fetching tracks for genre "${genre}":`, data);
            } else {
              console.warn(`No results found for genre: ${genre} (page ${offset/SPOTIFY_MAX_LIMIT + 1})`);
            }
            break;
          }
        }
        
        console.log(`Completed search for genre "${genre}" with ${totalTracksFetched} total tracks fetched`);
      }
      
      // After collecting all tracks, apply randomization and update state
      if (allFetchedTracks.length > 0) {
        const randomizedTracks = randomizeTracks(allFetchedTracks, trackCount, genres);
        updateSpotifyTracks(randomizedTracks);
      }
      
      if (!foundTracks) {
        toast({
          title: 'No tracks found',
          description: 'Try different genres or use keywords instead',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      } else {
        console.log(`Total tracks found after genre search: ${allFetchedTracks.length}, randomized to ${trackCount}`);
        
        // If we still don't have enough tracks, notify the user, but ONLY if this isn't an auto-search
        // on initial page load AND we have at least found some tracks
        if (allFetchedTracks.length < trackCount && !isAutoSearch && allFetchedTracks.length > 0) {
          console.log(`Insufficient tracks found (${allFetchedTracks.length}/${trackCount})`);
          toast({
            title: 'Limited track availability',
            description: `Only found ${allFetchedTracks.length} tracks. Will create playlist with all available tracks.`,
            status: 'info',
            duration: 4000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
      toast({
        title: 'Search failed',
        description: 'An error occurred while searching',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSearching(false);
      console.log('Genre search completed');
    }
  }, [session?.user?.accessToken, toast, setActiveSearchType, clearSpotifyTracks, updateSpotifyTracks, handleSignIn, isSearching, trackCount, setPlaylistUrl]);

  const handleSearchByKeywords = useCallback(async (keywords: string[], isAutoSearch = false) => {
    console.log('handleSearchByKeywords called with keywords:', keywords, 'isAutoSearch:', isAutoSearch);
    
    // Prevent duplicate calls if already searching
    if (isSearching) {
      console.warn('Search already in progress, ignoring duplicate call');
      return;
    }
    
    if (!session?.user?.accessToken) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in with Spotify to search for music',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      handleSignIn();
      return;
    }

    // Safety check for empty keywords array
    if (!keywords || keywords.length === 0) {
      console.warn('No keywords provided to search function');
      toast({
        title: 'No keywords selected',
        description: 'Please select at least one keyword to search',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Show notification for larger playlists only if not auto-searching
    if (trackCount > 50 && !isAutoSearch) {
      toast({
        title: 'Creating a Large Playlist',
        description: `Fetching tracks for a ${trackCount}-track playlist. This may take a moment.`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }

    setIsSearching(true);
    setActiveSearchType('keywords');
    clearSpotifyTracks();
    
    // Reset playlist URL when starting a new search
    setPlaylistUrl(null);

    try {
      console.log('Starting keyword search for', keywords.length, 'keywords');
      let foundTracks = false;
      let allFetchedTracks: SpotifyTrack[] = [];
      
      // Create a local copy of the keywords to avoid any potential issues
      const keywordsToSearch = [...keywords];
      
      // Calculate tracks per keyword based on trackCount
      // Significantly increase the multiplier for larger track counts
      // This is key to ensuring we get enough tracks for large playlists
      const multiplier = trackCount > 50 ? 5 : 3;
      const desiredTracksPerKeyword = Math.ceil((trackCount * multiplier) / keywordsToSearch.length);
      
      // Ensure we get at least 20 tracks per keyword for variety
      // BUT respect Spotify's API limit of 50 tracks per request
      const SPOTIFY_MAX_LIMIT = 50;
      const MIN_TRACKS_PER_KEYWORD = 20;
      
      console.log(`Aiming for ~${desiredTracksPerKeyword} tracks per keyword for a total target of ${trackCount} tracks`);
      
      for (const keyword of keywordsToSearch) {
        console.log('Searching for keyword:', keyword);
        let totalTracksFetched = 0;
        let offset = 0;
        
        // Calculate how many tracks we need to fetch for this keyword
        const tracksNeededForKeyword = Math.max(desiredTracksPerKeyword, MIN_TRACKS_PER_KEYWORD);
        
        // If we need more than 50 tracks, we'll need to make multiple requests with pagination
        // Increase the pagination depth for larger playlists
        const MAX_PAGINATION_DEPTH = trackCount > 50 ? 5 : 3;
        let paginationCount = 0;
        
        while (totalTracksFetched < tracksNeededForKeyword && paginationCount < MAX_PAGINATION_DEPTH) {
          // For each request, fetch up to 50 tracks (Spotify's limit)
          const tracksToFetch = Math.min(SPOTIFY_MAX_LIMIT, tracksNeededForKeyword - totalTracksFetched);
          
          console.log(`Fetching ${tracksToFetch} tracks for keyword "${keyword}" (offset: ${offset}, page ${paginationCount + 1}/${MAX_PAGINATION_DEPTH})`);
          paginationCount++;
          
          const response = await fetch(`/api/spotify?action=search&query=${encodeURIComponent(keyword)}&limit=${tracksToFetch}&offset=${offset}`);
          const data = await response.json();
        
          if (response.ok && data.tracks && data.tracks.length > 0) {
            // Add these tracks to our results
            console.log(`Found ${data.tracks.length} tracks for keyword: ${keyword} (page ${offset/SPOTIFY_MAX_LIMIT + 1})`);
            // Instead of adding directly, collect all tracks
            allFetchedTracks = [...allFetchedTracks, ...data.tracks];
            foundTracks = true;
            
            // Update counters for pagination
            totalTracksFetched += data.tracks.length;
            offset += SPOTIFY_MAX_LIMIT;
            
            // If we got fewer tracks than requested, there are no more to fetch
            if (data.tracks.length < tracksToFetch) {
              console.log(`No more tracks available for keyword: ${keyword} after fetching ${totalTracksFetched} tracks`);
              break;
            }
          } else {
            // If we get an error or no tracks, stop trying for this keyword
            if (!response.ok) {
              console.error(`Error fetching tracks for keyword "${keyword}":`, data);
            } else {
              console.warn(`No results found for keyword: ${keyword} (page ${offset/SPOTIFY_MAX_LIMIT + 1})`);
            }
            break;
          }
        }
        
        console.log(`Completed search for keyword "${keyword}" with ${totalTracksFetched} total tracks fetched`);

        // If we haven't reached our target track count after searching all keywords,
        // try to get more tracks by using keyword variations
        if (allFetchedTracks.length < trackCount * 1.2 && totalTracksFetched < tracksNeededForKeyword) {
          // Try searching with variations to get more tracks
          const variations = [
            `${keyword} music`,
            `best ${keyword}`,
            `popular ${keyword}`
          ];
          
          for (const variation of variations) {
            if (allFetchedTracks.length >= trackCount * 1.5) {
              // If we already have enough tracks, stop searching
              break;
            }
            
            console.log(`Trying variation search: "${variation}"`);
            
            const variationResponse = await fetch(`/api/spotify?action=search&query=${encodeURIComponent(variation)}&limit=${SPOTIFY_MAX_LIMIT}&offset=0`);
            const variationData = await variationResponse.json();
            
            if (variationResponse.ok && variationData.tracks && variationData.tracks.length > 0) {
              console.log(`Found ${variationData.tracks.length} tracks for variation: ${variation}`);
              // Instead of adding directly, collect all tracks
              allFetchedTracks = [...allFetchedTracks, ...variationData.tracks];
            }
          }
        }
      }
      
      // After collecting all tracks, apply randomization and update state
      if (allFetchedTracks.length > 0) {
        const randomizedTracks = randomizeTracks(allFetchedTracks, trackCount, keywords);
        updateSpotifyTracks(randomizedTracks);
      }
      
      if (!foundTracks) {
        toast({
          title: 'No tracks found',
          description: 'Try different keywords or use genres instead',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      } else {
        console.log(`Total tracks found after keyword search: ${allFetchedTracks.length}, randomized to ${trackCount}`);
        
        // Check if we have enough tracks
        if (allFetchedTracks.length < trackCount && !isAutoSearch && allFetchedTracks.length > 0) {
          toast({
            title: 'Limited track availability',
            description: `Only found ${allFetchedTracks.length} tracks. Will create playlist with all available tracks.`,
            status: 'info',
            duration: 4000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error searching by keywords:', error);
      toast({
        title: 'Search failed',
        description: 'An error occurred while searching',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSearching(false);
      console.log('Keyword search completed');
    }
  }, [session?.user?.accessToken, toast, setActiveSearchType, clearSpotifyTracks, updateSpotifyTracks, handleSignIn, isSearching, trackCount, setPlaylistUrl]);

  const handleAiSuggestions = useCallback((genres: string[], keywords: string[], explanation?: string) => {
    setAiSuggestions(genres, keywords, explanation);
    
    // Clear previous search results
    clearSpotifyTracks();
    
    // Search for tracks based on the suggested genres by default
    if (genres.length > 0 && session?.user?.accessToken) {
      handleSearchByGenres(genres);
    } else if (genres.length > 0 && !session?.user?.accessToken) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in with Spotify to search for music',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [setAiSuggestions, clearSpotifyTracks, session?.user?.accessToken, handleSearchByGenres, toast]);

  // Auto-search when arriving at the page with AI suggestions but no tracks
  useEffect(() => {
    // If we have genres but no tracks yet, trigger a search automatically
    if (selectedGame && 
        selectedGenres.length > 0 && 
        spotifyTracks.length === 0 && 
        session?.user?.accessToken && 
        !isSearching) {
      // Default to searching by genres, but pass true for isAutoSearch to avoid notifications
      console.log('Auto-searching by genres on page load');
      handleSearchByGenres(selectedGenres, true);
    }
  }, [selectedGame, selectedGenres, spotifyTracks.length, session?.user?.accessToken, handleSearchByGenres, isSearching]);

  const handleContinue = useCallback(async () => {
    if (!session?.user?.accessToken) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in with Spotify to create a playlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      handleSignIn();
      return null;
    }

    if (!selectedGame) {
      toast({
        title: 'No game selected',
        description: 'Please select a board game first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    if (spotifyTracks.length === 0) {
      toast({
        title: 'No tracks found',
        description: 'Please get AI suggestions to find matching tracks',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    // Track whether we need to show a track count adjustment notice
    let showTrackAdjustmentNotice = false;

    // Check if we have enough tracks for the requested playlist length
    // If not, we should refresh the track list first
    if (spotifyTracks.length < trackCount && !isSearching) {
      toast({
        title: 'Refreshing track list',
        description: `Fetching more tracks to meet your request for ${trackCount} tracks`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Trigger a new search based on the current selection type
      if (activeSearchType === 'genres') {
        await handleSearchByGenres(selectedGenres);
      } else {
        await handleSearchByKeywords(selectedKeywords);
      }
      
      // If after searching we still don't have enough tracks, we'll show a notice later
      if (spotifyTracks.length < trackCount) {
        showTrackAdjustmentNotice = true;
      }
    }

    console.log(`Creating playlist with track count: ${trackCount}`);
    setIsCreatingPlaylist(true);

    try {
      // Get current user's ID
      const userResponse = await fetch('/api/spotify?action=profile');
      const userData = await userResponse.json();

      if (!userResponse.ok || !userData.id) {
        throw new Error('Failed to get user profile');
      }

      // Create a playlist
      const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const playlistName = `${selectedGame.name} by BoardGame Beats - ${currentDate}`;
      
      // Create a shorter description to avoid exceeding Spotify's limit (max 300 characters)
      let playlistDescription = `A soundtrack for the board game "${selectedGame.name}" with genres: ${selectedGenres.join(', ')}`;
      
      // Add explanation if there's room (keeping total under 300 characters)
      if (aiExplanation && (playlistDescription.length + aiExplanation.length) < 295) {
        playlistDescription += `. ${aiExplanation}`;
      } else if (aiExplanation) {
        // If too long, truncate the explanation
        const remainingChars = 295 - playlistDescription.length;
        if (remainingChars > 10) { // Only add if we can include something meaningful
          playlistDescription += `. ${aiExplanation.substring(0, remainingChars - 3)}...`;
        }
      }
      
      // Spotify has a description limit of 300 characters
      if (playlistDescription.length > 300) {
        playlistDescription = playlistDescription.substring(0, 297) + '...';
      }

      const createPlaylistResponse = await fetch(`/api/spotify?action=createPlaylist&userId=${userData.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          description: playlistDescription,
          public: false,
        }),
      });

      const playlistData = await createPlaylistResponse.json();

      if (!createPlaylistResponse.ok || !playlistData.id) {
        throw new Error('Failed to create playlist');
      }

      // Determine the source of our tracks (genres or keywords)
      const sources = activeSearchType === 'genres' ? selectedGenres : selectedKeywords;
      
      // Prepare and distribute tracks evenly based on the trackCount
      let finalTrackUris: string[] = [];
      
      if (sources.length > 0 && spotifyTracks.length > 0) {
        console.log(`Preparing playlist with ${trackCount} tracks from ${spotifyTracks.length} available tracks`);
        
        // If we don't have enough tracks, use all available tracks and warn the user
        if (spotifyTracks.length < trackCount) {
          finalTrackUris = spotifyTracks.map(track => track.uri);
          console.log(`Not enough tracks available. Using all ${finalTrackUris.length} available tracks instead of ${trackCount}.`);
          
          // We'll show a combined notice at the end with the success message
          showTrackAdjustmentNotice = true;
        } else {
          // We have more than enough tracks, so distribute them evenly
          
          // First, ensure we're working with a shuffled copy of the tracks for better variety
          const shuffledTracks = [...spotifyTracks].sort(() => Math.random() - 0.5);
          
          // Create a mapping of tracks to their sources
          const tracksBySource: Record<string, SpotifyTrack[]> = {};
          sources.forEach(source => { tracksBySource[source] = []; });
          
          // Group tracks by source in round-robin fashion
          shuffledTracks.forEach((track, index) => {
            const source = sources[index % sources.length];
            tracksBySource[source].push(track);
          });
          
          // Log how many tracks we have per source
          sources.forEach(source => {
            console.log(`Source "${source}" has ${tracksBySource[source].length} tracks available`);
          });
          
          // Calculate how many tracks to take from each source
          const tracksPerSource = Math.floor(trackCount / sources.length);
          const remainder = trackCount % sources.length;
          
          console.log(`Aiming for ~${tracksPerSource} tracks per source (${sources.length} sources) to reach ${trackCount} total`);
          
          // Take tracks from each source in an interleaved pattern
          let tracksAdded = 0;
          let sourceIndex = 0;
          
          while (tracksAdded < trackCount && tracksAdded < spotifyTracks.length) {
            // Calculate which source to take from next (round-robin)
            const source = sources[sourceIndex % sources.length];
            const sourceTracks = tracksBySource[source];
            
            // If this source has tracks remaining, take one
            if (sourceTracks.length > 0) {
              const track = sourceTracks.shift(); // Take the first track
              if (track) {
                finalTrackUris.push(track.uri);
                tracksAdded++;
              }
            }
            
            // Move to the next source
            sourceIndex++;
            
            // If we've gone through all sources and still need more tracks,
            // just add any remaining tracks from any source
            if (sourceIndex >= sources.length * 2 && tracksAdded < trackCount && tracksAdded < spotifyTracks.length) {
              // Find any source that still has tracks
              for (const source of sources) {
                while (tracksBySource[source].length > 0 && tracksAdded < trackCount && tracksAdded < spotifyTracks.length) {
                  const track = tracksBySource[source].shift();
                  if (track) {
                    finalTrackUris.push(track.uri);
                    tracksAdded++;
                  }
                }
              }
            }
          }
        }
      } else {
        // Fallback if we can't group by source
        finalTrackUris = spotifyTracks.map(track => track.uri).slice(0, trackCount);
      }
      
      // Ensure we have exactly trackCount tracks, with a fallback for when we have fewer than requested
      const finalPlaylistLength = Math.min(trackCount, finalTrackUris.length);
      
      console.log(`Creating playlist with ${finalTrackUris.length} tracks out of ${trackCount} requested`);
      
      // Add tracks to the playlist - Spotify has a limit of 100 tracks per request
      // so we need to handle larger playlists in batches
      const MAX_TRACKS_PER_REQUEST = 100;
      
      // Process tracks in batches of 100
      for (let i = 0; i < finalTrackUris.length; i += MAX_TRACKS_PER_REQUEST) {
        const trackBatch = finalTrackUris.slice(i, i + MAX_TRACKS_PER_REQUEST);
        
        console.log(`Adding batch of ${trackBatch.length} tracks to playlist (${i+1} to ${Math.min(i+MAX_TRACKS_PER_REQUEST, finalTrackUris.length)})`);
      
      const addTracksResponse = await fetch(`/api/spotify?action=addTracksToPlaylist&playlistId=${playlistData.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uris: trackBatch,
        }),
      });

      if (!addTracksResponse.ok) {
          throw new Error(`Failed to add batch of tracks to playlist (batch ${i/MAX_TRACKS_PER_REQUEST + 1})`);
        }
      }

      // Save the playlist URL for the user to open in Spotify
      const spotifyUrl = playlistData.external_urls.spotify;
      setPlaylistUrl(spotifyUrl);

      // Show a single consolidated success message, potentially with track count adjustment notice
      if (showTrackAdjustmentNotice) {
        toast({
          title: 'Playlist created with track adjustment',
          description: `You requested ${trackCount} tracks, but only ${finalTrackUris.length} unique tracks were available. Your playlist has been created with all available tracks.`,
          status: 'success',
          duration: 7000,
          isClosable: true,
        });
      } else {
      toast({
        title: 'Playlist created',
          description: `Your playlist with ${finalTrackUris.length} tracks has been created in Spotify`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      }
      
      return spotifyUrl;

    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: 'Failed to create playlist',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setIsCreatingPlaylist(false);
    }
  }, [
    selectedGame, 
    selectedGenres, 
    spotifyTracks, 
    aiExplanation, 
    session?.user?.accessToken, 
    toast, 
    handleSignIn, 
    activeSearchType, 
    selectedKeywords, 
    trackCount,
    setIsCreatingPlaylist,
    setPlaylistUrl,
    isSearching,
    handleSearchByGenres,
    handleSearchByKeywords
  ]);

  const addSpotifyTracksWithRandomization = useCallback((newTracks: SpotifyTrack[]) => {
    // Add the tracks to the state but also apply randomization
    const sources = activeSearchType === 'genres' ? selectedGenres : selectedKeywords;
    const allTracks = [...spotifyTracks, ...newTracks];
    const randomizedTracks = randomizeTracks(allTracks, trackCount, sources);
    updateSpotifyTracks(randomizedTracks);
  }, [activeSearchType, selectedGenres, selectedKeywords, spotifyTracks, trackCount, updateSpotifyTracks]);

  // Track Section Component with refined layout
  function TrackSection() {
    return (
      <Box p={4} bg={cardBg} borderRadius="lg" shadow="md">
        <VStack spacing={3} align="stretch">
          <Heading size="md">Track Preview</Heading>
          <Text fontSize="sm" color={textSecondary}>
            Preview of your playlist based on the selected atmosphere. The final playlist will be optimized with these tracks.
          </Text>
          
          <Flex justify="space-between" align="center">
            <Text fontWeight="bold">
              Playlist length: {trackCount} tracks
            </Text>
            {spotifyTracks.length > 0 && (
              <Badge colorScheme="blue" p={1} borderRadius="md">
                {spotifyTracks.length} tracks available
              </Badge>
            )}
          </Flex>
        </VStack>
      </Box>
    );
  }

  // Game Header UI component
  function GameHeader() {
    // selectedGame cannot be null here because we have an early return if it's null
    const game = selectedGame!;
    
    return (
      <Box p={4} bg={cardBg} borderRadius="lg" shadow="md">
        <VStack spacing={4} align="stretch">
          <Flex align="center" gap={4}>
            {game.imageUrl && (
              <Image 
                src={game.imageUrl}
                alt={game.name}
                boxSize="80px"
                objectFit="cover"
                borderRadius="md"
              />
            )}
            <VStack align="flex-start" spacing={1}>
              <Heading size="md">{game.name}</Heading>
              {game.yearPublished && (
                <Text fontSize="sm" color={textSecondary}>
                  Published: {game.yearPublished}
                </Text>
              )}
            </VStack>
          </Flex>
          
          <Box>
            <Text fontWeight="bold" fontSize="sm" mb={1}>
              Suggested Play Time:
            </Text>
            <Text>
              {game.playingTime 
                ? `${game.playingTime} minutes`
                : 'Not specified'}
            </Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  if (!selectedGame) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <AlertTitle>No game selected!</AlertTitle>
            <AlertDescription>
              Please select a board game first to customize its atmosphere.
            </AlertDescription>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {status === 'unauthenticated' && (
            <Alert 
              status="warning" 
              variant="solid" 
              borderRadius="md"
              flexDirection={{ base: 'column', sm: 'row' }}
              alignItems="center"
              justifyContent="space-between"
              py={4}
            >
              <Flex alignItems="center">
                <AlertIcon />
                <Box>
                  <AlertTitle>Authentication Required</AlertTitle>
                  <AlertDescription>
                    Sign in with Spotify to search for music and create playlists
                  </AlertDescription>
                </Box>
              </Flex>
              <Button 
                colorScheme="green" 
                onClick={handleSignIn} 
                mt={{ base: 3, sm: 0 }}
                leftIcon={<Icon as={FaSpotify} />}
              >
                Connect with Spotify
              </Button>
            </Alert>
          )}

          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            align="center" 
            justify="center" 
            mb={2} 
            gap={{ base: 6, md: 10 }}
            p={4}
          >
            <Image
              src="/images/hero-image_small.jpg"
              alt="BoardGame Beats"
              borderRadius="lg"
              boxShadow="lg"
              maxW={{ base: '100%', md: '300px' }}
              maxH={{ base: '200px', md: '250px' }}
              objectFit="cover"
              order={{ base: 1, md: 0 }}
            />
            
            <Box textAlign={{ base: 'center', md: 'left' }} order={{ base: 0, md: 1 }}>
            <Heading as="h1" size="2xl" mb={4} color={textColor}>
                Mr Beats has spoken!
            </Heading>
            <Text fontSize="lg" color={gameTextColor}>
                Tailor your playlist for{' '}
                <Text 
                  as="span"
                  fontWeight="bold"
                  sx={{
                    background: "linear-gradient(90deg, #00bfff 0%, #ff00ff 50%, #00bfff 100%)",
                    backgroundSize: "200% 200%",
                    backgroundClip: "text",
                    textFillColor: "transparent",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    display: "inline-block",
                    animation: "gradient 15s ease-in-out infinite",
                    "@keyframes gradient": {
                      "0%": {
                        backgroundPosition: "0% 50%",
                      },
                      "50%": {
                        backgroundPosition: "100% 50%",
                      },
                      "100%": {
                        backgroundPosition: "0% 50%",
                      },
                    },
                  }}
                >
                  {selectedGame.name}
                </Text>
            </Text>
          </Box>
          </Flex>

          {aiExplanation && (
            <Box 
              p={6} 
              bg={cardBg} 
              borderRadius="lg" 
              borderWidth="1px" 
              borderColor={borderColor}
              shadow="md"
            >
              <Heading as="h3" size="md" mb={3} color={textColor}>
                My Atmosphere for you
              </Heading>
              <Text color={explanationTextColor}>
                {aiExplanation}
              </Text>
            </Box>
          )}

          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
            <GridItem>
              <Box 
                p={6} 
                bg={cardBg} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor={borderColor}
                shadow="md"
                transform={activeSearchType === 'genres' ? 'scale(1.03)' : 'scale(1)'}
                transition="all 0.2s"
                position="relative"
                overflow="hidden"
              >
                {activeSearchType === 'genres' && (
                  <>
                    {/* First glow layer - outer glow */}
                    <Box
                      position="absolute"
                      top="-10px"
                      right="-10px"
                      bottom="-10px"
                      left="-10px"
                      borderRadius="xl"
                      background="linear-gradient(-90deg,#007cf0,#00dfd8,#ff0080,#007cf0)"
                      backgroundSize="400% 100%"
                      animation={backgroundAnimation}
                      zIndex="0"
                      opacity="0.9"
                      _after={{
                        content: '""',
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        bottom: '0',
                        left: '0',
                        borderRadius: 'xl',
                        backgroundSize: 'inherit',
                        backgroundImage: 'inherit',
                        animation: 'inherit',
                        filter: 'blur(15px)',
                      }}
                    />
                    
                    {/* Second glow layer - medium glow */}
                    <Box
                      position="absolute"
                      top="-5px"
                      right="-5px"
                      bottom="-5px"
                      left="-5px"
                      borderRadius="lg"
                      background="linear-gradient(-90deg,#007cf0,#00dfd8,#ff0080,#007cf0)"
                      backgroundSize="400% 100%"
                      animation={backgroundAnimation}
                      zIndex="0"
                      opacity="0.95"
                      _after={{
                        content: '""',
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        bottom: '0',
                        left: '0',
                        borderRadius: 'lg',
                        backgroundSize: 'inherit',
                        backgroundImage: 'inherit',
                        animation: 'inherit',
                        filter: 'blur(8px)',
                      }}
                    />
                    
                    {/* Inner content background */}
                    <Box
                      position="absolute"
                      top="2px"
                      right="2px"
                      bottom="2px"
                      left="2px"
                      bg={cardBg}
                      borderRadius="md"
                      zIndex="1"
                    />
                  </>
                )}
                
                <Box position="relative" zIndex="2">
                <Button 
                  mt={4} 
                  bgGradient="linear(to-r, #ff36ab, #9644db, #2e4bff, #9644db, #ff36ab)"
                  color="white"
                  boxShadow="0 0 15px rgba(255, 54, 171, 0.5)"
                  transition="all 0.3s ease"
                  backgroundSize="400% 100%"
                  animation={backgroundAnimation}
                  _hover={{
                    bgGradient: "linear(to-r, #ff45b7, #a655e7, #3e5aff, #a655e7, #ff45b7)",
                    boxShadow: "0 0 20px rgba(255, 54, 171, 0.7)",
                    opacity: 0.9
                  }}
                  _active={{
                    bgGradient: "linear(to-r, #e62e98, #8639c7, #233ddb, #8639c7, #e62e98)",
                    boxShadow: "0 0 10px rgba(255, 54, 171, 0.4)",
                    opacity: 1
                  }}
                  _disabled={{
                    bgGradient: "linear(to-r, #ff36ab, #9644db, #2e4bff, #9644db, #ff36ab)",
                    backgroundSize: "400% 100%",
                    animation: "none",
                    opacity: 0.6,
                    boxShadow: "none",
                    cursor: "not-allowed"
                  }}
                  onClick={() => {
                    if (isSearching) {
                      return;
                    }
                    handleSearchByGenres(selectedGenres);
                  }}
                  isDisabled={selectedGenres.length === 0 || isSearching}
                  width="full"
                  isLoading={isSearching && activeSearchType === 'genres'}
                  loadingText="Searching..."
                >
                    Mr Beats Atmosphere
                </Button>
                  <Text 
                    fontSize="xs" 
                    color={activeSearchType === 'genres' ? '#1DB954' : 'gray.500'} 
                    fontWeight={activeSearchType === 'genres' ? 'bold' : 'normal'} 
                    textAlign="center" 
                    mt={1}
                  >
                    {activeSearchType === 'genres' && 'Selected'}
                </Text>
                </Box>
              </Box>
            </GridItem>

            <GridItem>
              <Box 
                p={6} 
                bg={cardBg} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor={borderColor}
                shadow="md"
                transform={activeSearchType === 'keywords' ? 'scale(1.03)' : 'scale(1)'}
                transition="all 0.2s"
                position="relative"
                overflow="hidden"
              >
                {activeSearchType === 'keywords' && (
                  <>
                    {/* First glow layer - outer glow */}
                    <Box
                      position="absolute"
                      top="-10px"
                      right="-10px"
                      bottom="-10px"
                      left="-10px"
                      borderRadius="xl"
                      background="linear-gradient(-90deg,#007cf0,#00dfd8,#ff0080,#007cf0)"
                      backgroundSize="400% 100%"
                      animation={backgroundAnimation}
                      zIndex="0"
                      opacity="0.9"
                      _after={{
                        content: '""',
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        bottom: '0',
                        left: '0',
                        borderRadius: 'xl',
                        backgroundSize: 'inherit',
                        backgroundImage: 'inherit',
                        animation: 'inherit',
                        filter: 'blur(15px)',
                      }}
                    />
                    
                    {/* Second glow layer - medium glow */}
                    <Box
                      position="absolute"
                      top="-5px"
                      right="-5px"
                      bottom="-5px"
                      left="-5px"
                      borderRadius="lg"
                      background="linear-gradient(-90deg,#007cf0,#00dfd8,#ff0080,#007cf0)"
                      backgroundSize="400% 100%"
                      animation={backgroundAnimation}
                      zIndex="0"
                      opacity="0.95"
                      _after={{
                        content: '""',
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        bottom: '0',
                        left: '0',
                        borderRadius: 'lg',
                        backgroundSize: 'inherit',
                        backgroundImage: 'inherit',
                        animation: 'inherit',
                        filter: 'blur(8px)',
                      }}
                    />
                    
                    {/* Inner content background */}
                    <Box
                      position="absolute"
                      top="2px"
                      right="2px"
                      bottom="2px"
                      left="2px"
                      bg={cardBg}
                      borderRadius="md"
                      zIndex="1"
                    />
                  </>
                )}
                
                <Box position="relative" zIndex="2">
                <Button 
                  mt={4} 
                  bgGradient="linear(to-r, #ffc226, #ff9d2b, #ff7730, #ff9d2b, #ffc226)"
                  color="white"
                  boxShadow="0 0 15px rgba(255, 194, 38, 0.5)"
                  transition="all 0.3s ease"
                  backgroundSize="400% 100%"
                  animation={backgroundAnimation}
                  _hover={{
                    bgGradient: "linear(to-r, #ffcb3d, #ffa642, #ff8542, #ffa642, #ffcb3d)",
                    boxShadow: "0 0 20px rgba(255, 194, 38, 0.7)",
                    opacity: 0.9
                  }}
                  _active={{
                    bgGradient: "linear(to-r, #e6af22, #e69126, #e66a2b, #e69126, #e6af22)",
                    boxShadow: "0 0 10px rgba(255, 194, 38, 0.4)",
                    opacity: 1
                  }}
                  _disabled={{
                    bgGradient: "linear(to-r, #ffc226, #ff9d2b, #ff7730, #ff9d2b, #ffc226)",
                    backgroundSize: "400% 100%",
                    animation: "none",
                    opacity: 0.6,
                    boxShadow: "none",
                    cursor: "not-allowed"
                  }}
                  onClick={() => {
                    if (isSearching) {
                      return;
                    }
                    
                    console.log('Keyword search button clicked, selected keywords:', selectedKeywords);
                    if (selectedKeywords.length > 0) {
                      console.log('Calling handleSearchByKeywords with:', selectedKeywords);
                      const keywordsToSearch = [...selectedKeywords];
                      handleSearchByKeywords(keywordsToSearch);
                    } else {
                      toast({
                        title: 'No keywords selected',
                        description: 'Please select at least one keyword to search',
                        status: 'warning',
                        duration: 3000,
                        isClosable: true,
                      });
                    }
                  }}
                  isDisabled={selectedKeywords.length === 0 || isSearching}
                  width="full"
                  isLoading={isSearching && activeSearchType === 'keywords'}
                  loadingText="Searching..."
                >
                    Alternate Selection
                </Button>
                  <Text 
                    fontSize="xs" 
                    color={activeSearchType === 'keywords' ? '#1DB954' : 'gray.500'} 
                    fontWeight={activeSearchType === 'keywords' ? 'bold' : 'normal'} 
                    textAlign="center" 
                    mt={1}
                  >
                    {activeSearchType === 'keywords' && 'Selected'}
                </Text>
                </Box>
              </Box>
            </GridItem>
          </Grid>

          <Box 
            p={6} 
            bg={cardBg} 
            borderRadius="lg" 
            borderWidth="1px" 
            borderColor={borderColor}
            shadow="md"
          >
            <TrackSection />
          </Box>

          {/* Spotify Button above Search Results */}
          {status === 'authenticated' && (
            <Flex justify="center" my={4}>
              <Button 
                colorScheme="green" 
                size="lg" 
                onClick={async () => {
                  if (playlistUrl) {
                    // If playlist already exists, just open it
                    window.open(playlistUrl, '_blank');
                  } else {
                    // Check if we need to refresh tracks first
                    if (spotifyTracks.length < trackCount && !isSearching) {
                      setIsCreatingPlaylist(true); // Show loading state during refresh
                    }
                    
                    // Create the playlist and open it
                    const newPlaylistUrl = await handleContinue();
                    if (newPlaylistUrl) {
                      window.open(newPlaylistUrl, '_blank');
                    }
                  }
                }}
                px={10}
                py={6}
                isLoading={isCreatingPlaylist}
                loadingText={spotifyTracks.length < trackCount && !isSearching ? "Refreshing tracks..." : "Creating Playlist"}
                isDisabled={spotifyTracks.length === 0}
                leftIcon={<Icon as={FaSpotify} boxSize={5} />}
                borderRadius="full"
                bgColor="#1DB954"
                _hover={{ bgColor: "#1ED760" }}
                _active={{ bgColor: "#1AA64B" }}
                fontWeight="bold"
                fontSize="md"
                boxShadow="md"
              >
                {playlistUrl ? 'Open Playlist in Spotify' : 'Create & Play on Spotify'}
              </Button>
            </Flex>
          )}

          {/* Search Results Section */}
          <Box 
            p={6} 
            bg={cardBg} 
            borderRadius="lg" 
            borderWidth="1px" 
            borderColor={borderColor}
            shadow="md"
          >
            <Heading as="h3" size="md" mb={4} color={textColor}>
              Playlist Sample
              {activeSearchType && (
                <Badge ml={2} bg="#1DB954" color="white">
                  {activeSearchType === 'genres' ? 'MAIN' : 'Alternate'}
                </Badge>
              )}
            </Heading>
            
            {isSearching ? (
              <Flex justify="center" py={10}>
                <Spinner size="xl" />
              </Flex>
            ) : spotifyTracks.length > 0 ? (
              <>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 5 }} spacing={4}>
                  {spotifyTracks.slice(0, 25).map((track: SpotifyTrack) => (
                  <Card key={track.id} overflow="hidden" variant="outline">
                    <CardBody p={3}>
                      <Image
                        src={track.album.images[0]?.url || '/images/music-placeholder.png'}
                        alt={track.name}
                        borderRadius="md"
                        objectFit="cover"
                        width="100%"
                        height="160px"
                      />
                      <Stack mt={2} spacing={1}>
                        <Heading size="sm" noOfLines={1} title={track.name}>
                          {track.name}
                        </Heading>
                        <Text fontSize="sm" color="gray.500" noOfLines={1}>
                          {track.artists.map(artist => artist.name).join(', ')}
                        </Text>
                        <Text fontSize="xs" color="gray.400" noOfLines={1}>
                          {track.album.name}
                        </Text>
                      </Stack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
              </>
            ) : (
              <Text textAlign="center" color="gray.500" py={10}>
                Music suggestions have been generated based on {selectedGame.name}. 
                Click &quot;Mr Beats Atmosphere&quot; or &quot;Alternate Selection&quot; to find matching tracks.
              </Text>
            )}
          </Box>

          <Divider my={1} />

          <Flex justify="center" mt={0} direction="column" align="center" gap={2}>
            {status === 'authenticated' ? (
                <Button 
                colorScheme="green" 
                  size="lg" 
                onClick={async () => {
                  if (playlistUrl) {
                    // If playlist already exists, just open it
                    window.open(playlistUrl, '_blank');
                  } else {
                    // Check if we need to refresh tracks first
                    if (spotifyTracks.length < trackCount && !isSearching) {
                      setIsCreatingPlaylist(true); // Show loading state during refresh
                    }
                    
                    // Create the playlist and open it
                    const newPlaylistUrl = await handleContinue();
                    if (newPlaylistUrl) {
                      window.open(newPlaylistUrl, '_blank');
                    }
                  }
                }}
                px={10}
                py={6}
                  isLoading={isCreatingPlaylist}
                loadingText={spotifyTracks.length < trackCount && !isSearching ? "Refreshing tracks..." : "Creating Playlist"}
                  isDisabled={spotifyTracks.length === 0}
                leftIcon={<Icon as={FaSpotify} boxSize={5} />}
                borderRadius="full"
                bgColor="#1DB954"
                _hover={{ bgColor: "#1ED760" }}
                _active={{ bgColor: "#1AA64B" }}
                fontWeight="bold"
                fontSize="md"
                boxShadow="md"
              >
                {playlistUrl ? 'Open Playlist in Spotify' : 'Create & Play on Spotify'}
                </Button>
            ) : (
              <Button 
                colorScheme="green" 
                size="lg" 
                onClick={handleSignIn}
                px={10}
                py={6}
                leftIcon={<Icon as={FaSpotify} boxSize={5} />}
                borderRadius="full"
                bgColor="#1DB954"
                _hover={{ bgColor: "#1ED760" }}
                _active={{ bgColor: "#1AA64B" }}
                fontWeight="bold"
                fontSize="md"
                boxShadow="md"
              >
                Connect with Spotify
              </Button>
            )}

            {(selectedGenres.length === 0 && selectedKeywords.length === 0) && (
              <Text textAlign="center" color="red.500">
                Please select at least one genre or keyword to continue
              </Text>
            )}
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
} 
