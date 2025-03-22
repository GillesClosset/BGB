'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useColorModeValue,
  Flex,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
  Badge,
  Progress,
  Card,
  CardBody,
  Image,
  Spinner,
  Stack,
  Divider,
} from '@chakra-ui/react';
import { useSession, signIn } from 'next-auth/react';
import { FaSpotify, FaMusic, FaExternalLinkAlt } from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';
import { SpotifyTrack } from '@/app/types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Seed track information for lookup
const SEED_TRACKS = [
  { title: "The Ecstasy of Gold", artist: "Ennio Morricone" },
  { title: "Space Oddity", artist: "David Bowie" },
  { title: "Sandstorm", artist: "Darude" },
  { title: "Imperial March", artist: "John Williams" },
  { title: "Dune Theme", artist: "Toto" }
];

// Audio features for ReccoBeats API
const AUDIO_FEATURES = {
  acousticness: 0.2,
  danceability: 0.4,
  energy: 0.7,
  instrumentalness: 0.8,
  liveness: 0.1,
  speechiness: 0.05,
  tempo_min: 120,
  tempo_max: 140,
  valence: 0.4
};

// Interface for track with energy and tempo
interface TrackWithFeatures extends SpotifyTrack {
  energy?: number;
  tempo?: number;
  external_urls: { spotify: string };
}

// ReccoBeats API response tracks
interface ReccoTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  popularity: number;
  uri: string;
  external_urls: { spotify: string };
  duration_ms: number;
}

export default function ReccoTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [seedTrackIds, setSeedTrackIds] = useState<string[]>([]);
  const [seedTrackDetails, setSeedTrackDetails] = useState<SpotifyTrack[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<TrackWithFeatures[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [searchProgress, setSearchProgress] = useState(0);
  
  const toast = useToast();
  const { data: session, status } = useSession();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const alertBg = useColorModeValue('blue.50', 'blue.900');

  // Step 1: Find seed tracks on Spotify
  const findSeedTracks = useCallback(async () => {
    if (status !== 'authenticated') {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in with Spotify to continue',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSearching(true);
    setSearchProgress(0);
    setSeedTrackIds([]);
    setSeedTrackDetails([]);

    try {
      const foundIds: string[] = [];
      const foundTracks: SpotifyTrack[] = [];
      
      for (let i = 0; i < SEED_TRACKS.length; i++) {
        const { title, artist } = SEED_TRACKS[i];
        const query = `track:${title} artist:${artist}`;
        
        const response = await fetch(
          `/api/spotify?action=search&query=${encodeURIComponent(query)}&limit=1`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to search for "${title}" by ${artist}`);
        }
        
        const data = await response.json();
        
        if (data.tracks && data.tracks.length > 0) {
          console.log(`Found "${title}" by ${artist}: ${data.tracks[0].id}`);
          foundIds.push(data.tracks[0].id);
          foundTracks.push(data.tracks[0]);
        } else {
          console.log(`Could not find "${title}" by ${artist}`);
          toast({
            title: 'Track Not Found',
            description: `Could not find "${title}" by ${artist}`,
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
        
        // Update progress
        setSearchProgress(((i + 1) / SEED_TRACKS.length) * 100);
      }
      
      setSeedTrackIds(foundIds);
      setSeedTrackDetails(foundTracks);
      
      if (foundIds.length > 0) {
        toast({
          title: 'Seed Tracks Found',
          description: `Found ${foundIds.length} out of ${SEED_TRACKS.length} seed tracks`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'No Seed Tracks Found',
          description: 'Could not find any of the specified seed tracks',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error finding seed tracks:', error);
      toast({
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSearching(false);
    }
  }, [status, toast]);

  // Step 2: Get recommendations from ReccoBeats API
  const getRecommendations = useCallback(async () => {
    if (seedTrackIds.length === 0) {
      toast({
        title: 'No Seed Tracks',
        description: 'Please find seed tracks first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setRecommendedTracks([]);

    try {
      console.log(`Getting recommendations using seed tracks: ${seedTrackIds.join(', ')}`);
      
      // Build query parameters - simplified to only essential parameters
      const params = new URLSearchParams({
        seeds: seedTrackIds.join(','),
        size: '40',
        // Removed market parameter
        // Adding only tempo from audio features
        min_tempo: AUDIO_FEATURES.tempo_min.toString(),
        max_tempo: AUDIO_FEATURES.tempo_max.toString()
      });
      
      console.log('Making request with params:', params.toString());
      
      // Use our server-side API route with GET instead of POST
      const response = await fetch(`/api/reccobeats?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Log the raw response to debug
      console.log('ReccoBeats API response:', data);
      
      // Determine what kind of data structure we got back
      let tracksToProcess = [];
      
      if (Array.isArray(data)) {
        // If the API returns an array directly
        console.log('API returned an array of tracks');
        tracksToProcess = data;
      } else if (data.tracks && Array.isArray(data.tracks)) {
        // If the API returns an object with a tracks array
        console.log('API returned an object with tracks property');
        tracksToProcess = data.tracks;
      } else if (data.items && Array.isArray(data.items)) {
        // If the API returns an object with an items array
        console.log('API returned an object with items property');
        tracksToProcess = data.items;
      } else {
        // Look for any array property in the response
        const possibleArrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (possibleArrayProps.length > 0) {
          console.log(`Found array property: ${possibleArrayProps[0]}`);
          tracksToProcess = data[possibleArrayProps[0]];
        } else {
          console.error('Could not find tracks array in response:', data);
          throw new Error('Unexpected API response format - no tracks found');
        }
      }
      
      if (tracksToProcess.length === 0) {
        throw new Error('No recommendations found');
      }
      
      console.log(`Processing ${tracksToProcess.length} tracks`);
      
      // Adapt the tracks to our expected format if needed
      const normalizedTracks = tracksToProcess.map((track: any) => {
        // Ensure we have a valid Spotify ID
        let spotifyId = track.id || '';
        
        // If we have a Spotify URL but no ID, extract ID from URL
        if (!spotifyId && track.external_urls?.spotify) {
          spotifyId = track.external_urls.spotify.split('track/').pop()?.split('?')[0] || '';
        }
        
        // If we have a URI but no ID, extract ID from URI
        if (!spotifyId && track.uri) {
          spotifyId = track.uri.split('spotify:track:').pop() || '';
        }
        
        // Create Spotify URI from ID if needed
        let uri = track.uri;
        if (!uri && spotifyId) {
          uri = `spotify:track:${spotifyId}`;
        }
        
        // Create external URL from ID if needed
        let externalUrl = track.external_urls?.spotify;
        if (!externalUrl && spotifyId) {
          externalUrl = `https://open.spotify.com/track/${spotifyId}`;
        }
        
        // Create a normalized track structure regardless of input format
        return {
          id: spotifyId,
          name: track.name || track.trackTitle || 'Unknown Track',
          artists: track.artists || 
                  (track.artist ? [{ id: '0', name: track.artist }] : [{ id: '0', name: 'Unknown Artist' }]),
          album: track.album || { 
            id: '0', 
            name: track.albumName || 'Unknown Album', 
            images: track.albumCover ? [{ url: track.albumCover, height: 300, width: 300 }] : []
          },
          uri: uri,
          external_urls: { spotify: externalUrl || '' },
          duration_ms: track.duration_ms || track.durationMs || 0,
          popularity: track.popularity || 0
        };
      });
      
      // Enrich tracks with energy and tempo from Supabase
      const tracksWithFeatures = await getTrackFeaturesFromSupabase(normalizedTracks);
      
      // Sort tracks by energy (low to high)
      const sortedTracks = tracksWithFeatures.sort((a, b) => {
        if (a.energy === undefined) return 1;
        if (b.energy === undefined) return -1;
        return a.energy - b.energy;
      });
      
      setRecommendedTracks(sortedTracks);
      
      toast({
        title: 'Recommendations Generated',
        description: `Found ${sortedTracks.length} tracks sorted by energy`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast({
        title: 'Recommendation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [seedTrackIds, toast]);

  // Step 3: Get track features from Supabase
  const getTrackFeaturesFromSupabase = async (tracks: ReccoTrack[]): Promise<TrackWithFeatures[]> => {
    try {
      const trackIds = tracks.map(track => track.id);
      console.log(`Looking up features for ${trackIds.length} tracks in Supabase`);
      
      // Query database for energy and tempo values
      const { data, error } = await supabase
        .from('songs_with_attributes')
        .select('id, energy, tempo')
        .in('id', trackIds);
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log(`Found features for ${data?.length || 0} out of ${trackIds.length} tracks`);
      
      // Create a map for quick lookups
      const featuresMap = new Map();
      if (data) {
        data.forEach(item => {
          featuresMap.set(item.id, {
            energy: item.energy,
            tempo: item.tempo
          });
        });
      }
      
      // Combine original tracks with features
      return tracks.map(track => {
        const features = featuresMap.get(track.id);
        return {
          ...track,
          energy: features?.energy,
          tempo: features?.tempo
        };
      });
    } catch (error) {
      console.error('Error getting track features:', error);
      toast({
        title: 'Database Query Error',
        description: 'Could not retrieve track features from database',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      // Return original tracks if lookup fails
      return tracks.map(track => ({ ...track }));
    }
  };

  // Step 4: Create a playlist on Spotify
  const createPlaylist = useCallback(async () => {
    if (!session?.user?.id || recommendedTracks.length === 0) {
      toast({
        title: 'Cannot Create Playlist',
        description: 'Please generate recommendations first and ensure you are logged in',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsCreatingPlaylist(true);

    try {
      // First, verify which tracks actually exist in Spotify
      console.log('Verifying track IDs with Spotify...');
      
      // Get unique track IDs from the recommendations
      const trackIds = recommendedTracks.map(track => track.id).filter(Boolean);
      const validTrackIds = new Set();
      
      // Check tracks in batches of 20 (Spotify API limit)
      for (let i = 0; i < trackIds.length; i += 20) {
        const batch = trackIds.slice(i, i + 20);
        const idsParam = batch.join(',');
        
        try {
          // Call Spotify API to check which tracks exist
          const verifyResponse = await fetch(`/api/spotify?action=getTracks&ids=${idsParam}`);
          
          if (!verifyResponse.ok) {
            console.warn(`Error verifying batch ${i/20 + 1}:`, verifyResponse.status);
            continue;
          }
          
          const verifyData = await verifyResponse.json();
          
          // Add valid track IDs to our set
          if (verifyData.tracks) {
            verifyData.tracks.forEach(track => {
              if (track && track.id) {
                validTrackIds.add(track.id);
              }
            });
          }
        } catch (e) {
          console.warn(`Error checking batch ${i/20 + 1}:`, e);
        }
      }
      
      console.log(`Verified ${validTrackIds.size} out of ${trackIds.length} tracks exist on Spotify`);
      
      if (validTrackIds.size === 0) {
        throw new Error('None of the recommended tracks could be found on Spotify. Cannot create playlist.');
      }
      
      // Create a new playlist
      const playlistName = `ReccoBeats Recommendations ${new Date().toLocaleDateString()}`;
      const playlistDescription = 'Tracks recommended by ReccoBeats API, sorted by energy';
      
      console.log('Creating playlist:', playlistName);
      
      // Move the action parameter to the URL instead of the request body
      const createResponse = await fetch(`/api/spotify?action=createPlaylist&userId=${session.user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          description: playlistDescription,
          public: false
        }),
      });
      
      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(`Failed to create playlist: ${errorData.error || 'Unknown error'}`);
      }
      
      const playlist = await createResponse.json();
      console.log('Playlist created:', playlist.id);
      
      // Filter to only include tracks that were verified to exist in Spotify
      const validTracks = recommendedTracks.filter(track => validTrackIds.has(track.id));
      
      // Add tracks to the playlist using verified Spotify URIs
      const trackUris = validTracks.map(track => `spotify:track:${track.id}`);
      
      console.log(`Adding ${trackUris.length} verified tracks to playlist`);
      
      if (trackUris.length === 0) {
        throw new Error('No valid track URIs found to add to playlist');
      }
      
      const addTracksResponse = await fetch(`/api/spotify?action=addTracksToPlaylist&playlistId=${playlist.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: trackUris
        }),
      });
      
      if (!addTracksResponse.ok) {
        const errorData = await addTracksResponse.json();
        throw new Error(`Failed to add tracks: ${errorData.error || 'Unknown error'}`);
      }
      
      // Set playlist URL for user to open
      setPlaylistUrl(playlist.external_urls.spotify);
      
      toast({
        title: 'Playlist Created',
        description: `Your playlist has been created with ${trackUris.length} verified tracks`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: 'Playlist Creation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreatingPlaylist(false);
    }
  }, [recommendedTracks, session?.user?.id, toast]);

  // Handle Spotify sign in
  const handleSignIn = useCallback(async () => {
    try {
      await signIn('spotify', { callbackUrl: window.location.pathname });
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'Authentication Failed',
        description: 'Failed to sign in with Spotify',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Run the full workflow in sequence
  const runFullWorkflow = useCallback(async () => {
    if (status !== 'authenticated') {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in with Spotify to continue',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Clear previous results
    setSeedTrackIds([]);
    setSeedTrackDetails([]);
    setRecommendedTracks([]);
    setPlaylistUrl(null);
    
    // Step 1: Find seed tracks
    await findSeedTracks();
    
    // Continue only if we found seed tracks
    if (seedTrackIds.length > 0) {
      // Step 2: Get recommendations
      await getRecommendations();
    }
  }, [status, toast, findSeedTracks, seedTrackIds.length, getRecommendations]);

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={8}>
            <Heading as="h1" size="2xl" mb={4} 
              bgGradient="linear(to-r, #1DB954, #4B0082)"
              bgClip="text"
            >
              ReccoBeats API Test
            </Heading>
            <Text fontSize="lg" color={useColorModeValue('gray.600', 'gray.400')}>
              Generate recommendations using ReccoBeats API with specific audio features
            </Text>
          </Box>

          {status === 'unauthenticated' && (
            <Alert status="info" borderRadius="md" bg={alertBg} mb={4}>
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Sign in with Spotify</AlertTitle>
                <AlertDescription display="block">
                  Connect your Spotify account to generate music recommendations
                </AlertDescription>
              </Box>
              <Button 
                colorScheme="green" 
                leftIcon={<FaSpotify />} 
                onClick={handleSignIn}
                ml={4}
              >
                Sign In
              </Button>
            </Alert>
          )}

          {/* Workflow steps */}
          <Flex justify="center" gap={4} flexWrap="wrap">
            <Button
              colorScheme="blue"
              onClick={findSeedTracks}
              isLoading={isSearching}
              loadingText="Searching..."
              leftIcon={<FaSpotify />}
              disabled={status !== 'authenticated'}
            >
              1. Find Seed Tracks
            </Button>
            <Button
              colorScheme="purple"
              onClick={getRecommendations}
              isLoading={isLoading}
              loadingText="Getting Recommendations..."
              leftIcon={<FaMusic />}
              disabled={status !== 'authenticated' || seedTrackIds.length === 0}
            >
              2. Get Recommendations
            </Button>
            <Button
              colorScheme="green"
              onClick={createPlaylist}
              isLoading={isCreatingPlaylist}
              loadingText="Creating Playlist..."
              leftIcon={<FaSpotify />}
              disabled={status !== 'authenticated' || recommendedTracks.length === 0}
            >
              3. Create Playlist
            </Button>
            <Button
              colorScheme="teal"
              onClick={runFullWorkflow}
              isLoading={isSearching || isLoading || isCreatingPlaylist}
              loadingText="Running Full Workflow..."
              disabled={status !== 'authenticated'}
            >
              Run All Steps
            </Button>
          </Flex>

          {/* Search progress */}
          {isSearching && (
            <Box mt={4}>
              <Text mb={2}>Searching for seed tracks... {Math.round(searchProgress)}%</Text>
              <Progress value={searchProgress} colorScheme="blue" size="sm" borderRadius="md" />
            </Box>
          )}

          {/* Seed tracks section */}
          {seedTrackDetails.length > 0 && (
            <Box mt={6} p={4} borderWidth="1px" borderRadius="lg">
              <Heading as="h3" size="md" mb={4}>
                Seed Tracks ({seedTrackDetails.length}/{SEED_TRACKS.length})
              </Heading>
              <Flex wrap="wrap" gap={4} justifyContent="center">
                {seedTrackDetails.map(track => (
                  <Card key={track.id} maxW="sm" overflow="hidden" variant="outline" width="220px">
                    <CardBody p={3}>
                      <Image
                        src={track.album.images[0]?.url || '/album-placeholder.png'}
                        alt={track.name}
                        borderRadius="md"
                        height="120px"
                        width="100%"
                        objectFit="cover"
                        mb={2}
                      />
                      <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                        {track.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {track.artists.map(a => a.name).join(', ')}
                      </Text>
                    </CardBody>
                  </Card>
                ))}
              </Flex>
            </Box>
          )}

          {/* Audio features section */}
          <Box mt={4} p={4} borderWidth="1px" borderRadius="lg">
            <Heading as="h3" size="md" mb={4}>
              Audio Features for Recommendations
            </Heading>
            <Flex wrap="wrap" gap={4} justifyContent="center">
              <Badge colorScheme="blue" p={2}>Acousticness: {AUDIO_FEATURES.acousticness}</Badge>
              <Badge colorScheme="green" p={2}>Danceability: {AUDIO_FEATURES.danceability}</Badge>
              <Badge colorScheme="red" p={2}>Energy: {AUDIO_FEATURES.energy}</Badge>
              <Badge colorScheme="purple" p={2}>Instrumentalness: {AUDIO_FEATURES.instrumentalness}</Badge>
              <Badge colorScheme="yellow" p={2}>Liveness: {AUDIO_FEATURES.liveness}</Badge>
              <Badge colorScheme="cyan" p={2}>Speechiness: {AUDIO_FEATURES.speechiness}</Badge>
              <Badge colorScheme="orange" p={2}>Tempo: {AUDIO_FEATURES.tempo_min}-{AUDIO_FEATURES.tempo_max} BPM</Badge>
              <Badge colorScheme="pink" p={2}>Valence: {AUDIO_FEATURES.valence}</Badge>
            </Flex>
          </Box>

          {/* Playlist URL if created */}
          {playlistUrl && (
            <Alert
              status="success"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              borderRadius="lg"
              p={4}
              bg={useColorModeValue('green.50', 'green.900')}
            >
              <AlertIcon boxSize="24px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Playlist Created Successfully!
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                <Link href={playlistUrl} isExternal color={useColorModeValue('green.600', 'green.200')} fontWeight="bold">
                  Open Playlist on Spotify <FaExternalLinkAlt style={{ display: 'inline', marginLeft: '4px' }} />
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Recommended tracks table */}
          {recommendedTracks.length > 0 && (
            <Box mt={6} overflowX="auto">
              <Heading as="h3" size="md" mb={4}>
                Recommended Tracks (Sorted by Energy, Low to High)
              </Heading>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th width="40px">#</Th>
                    <Th>Track</Th>
                    <Th>Artist</Th>
                    <Th isNumeric>Energy</Th>
                    <Th isNumeric>Tempo (BPM)</Th>
                    <Th width="50px">Open</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recommendedTracks.map((track, index) => (
                    <Tr key={track.id}>
                      <Td>{index + 1}</Td>
                      <Td>{track.name}</Td>
                      <Td>{track.artists.map(a => a.name).join(', ')}</Td>
                      <Td isNumeric>
                        {track.energy !== undefined 
                          ? <Badge colorScheme={track.energy < 0.4 ? "green" : track.energy < 0.7 ? "orange" : "red"}>
                              {track.energy.toFixed(2)}
                            </Badge>
                          : 'N/A'
                        }
                      </Td>
                      <Td isNumeric>{track.tempo !== undefined ? Math.round(track.tempo) : 'N/A'}</Td>
                      <Td>
                        <Link href={track.external_urls.spotify} isExternal>
                          <FaSpotify />
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
} 