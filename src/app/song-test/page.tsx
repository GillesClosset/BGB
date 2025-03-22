'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  Stack,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import SearchBar from '@/app/components/search/SearchBar';
import GameDetails from '@/app/components/search/GameDetails';
import TrackCount from '@/app/components/atmosphere/TrackCount';
import { BoardGame, SpotifyTrack } from '@/app/types';
import { SearchResult } from '@/app/types/index';
import { useAtmosphere } from '@/app/context/atmosphere-context';
import { useSession, signIn } from 'next-auth/react';
import { FaSpotify } from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Add new types for statistics
interface TrackStatistics {
  totalTracks: number;
  matchedTracks: number;
  matchPercentage: number;
  matchedIds: string[];
}

export default function SongTestPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTracks, setIsGeneratingTracks] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [spotifyTracks, setSpotifyTracks] = useState<SpotifyTrack[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [rawSearchResults, setRawSearchResults] = useState<any[]>([]);
  const [trackStats, setTrackStats] = useState<TrackStatistics>({
    totalTracks: 0,
    matchedTracks: 0,
    matchPercentage: 0,
    matchedIds: []
  });
  const { 
    setSelectedGame, 
    setSearchResult, 
    trackCount,
    updateTrackCount,
  } = useAtmosphere();
  
  const toast = useToast();
  const { data: session, status } = useSession();
  const loadedGameRef = useRef<BoardGame | null>(null);
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const alertBg = useColorModeValue('blue.50', 'blue.900');

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast({
        title: 'Authentication Required',
        description: 'You need to sign in with Spotify to generate music',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [status, toast]);

  const handleSearch = useCallback((results: SearchResult[]) => {
    setSearchResults(results);
    setIsLoading(false);
  }, []);

  const handleSelectGame = useCallback((game: any) => {
    setSelectedGameId(game.id);
    setSearchResult(game);
  }, [setSearchResult]);

  const handleGameLoaded = useCallback((game: BoardGame) => {
    setSelectedGame(game);
    loadedGameRef.current = game;
  }, [setSelectedGame]);

  const handleSignIn = useCallback(async () => {
    try {
      await signIn('spotify', { callbackUrl: window.location.pathname });
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'Authentication Failed',
        description: 'There was an error signing in with Spotify',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleTrackCountChange = useCallback((count: number) => {
    updateTrackCount(count);
  }, [updateTrackCount]);

  // Function to search tracks in Supabase database based on keywords
  const searchSupabase = async (searchQuery: string) => {
    try {
      console.log('Searching for:', searchQuery);
      
      // Use a simpler query with index hint
      const { data, error } = await supabase
        .from('songs_with_attributes')
        .select('id, name, album_name, artists, danceability, energy')
        .ilike('name', `%${searchQuery}%`)
        .limit(5) // Reduced limit
        .abortSignal(AbortSignal.timeout(3000)); // Reduced timeout

      if (error) {
        console.error('Search query error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log(`No results found for query "${searchQuery}"`);
        return { query: searchQuery, results: [] };
      }

      console.log(`Found ${data.length} results for "${searchQuery}"`);

      // Transform the data to match our SpotifyTrack interface
      const tracks = data.map(track => ({
        id: track.id || '',
        name: track.name || '',
        artists: [{ 
          id: track.id || '', 
          name: track.artists || '' 
        }],
        album: {
          id: track.id || '',
          name: track.album_name || '',
          images: [{ 
            url: '/album-placeholder.png',
            height: 640,
            width: 640 
          }]
        },
        duration_ms: 0, // We'll fetch full details later if needed
        uri: `spotify:track:${track.id}`,
        external_urls: {
          spotify: `https://open.spotify.com/track/${track.id}`
        },
        popularity: 0,
        attributes: {
          danceability: track.danceability,
          energy: track.energy
        }
      }));

      return { query: searchQuery, results: tracks };
    } catch (error) {
      console.error('Error in searchSupabase:', error);
      if (!(error instanceof Error && error.message.includes('timeout'))) {
        toast({
          title: 'Database Error',
          description: error instanceof Error ? error.message : 'Unknown database error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      return { query: searchQuery, results: [] };
    }
  };

  const generateSongList = useCallback(async () => {
    if (!loadedGameRef.current) {
      toast({
        title: 'No Game Selected',
        description: 'Please select a board game first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsGeneratingTracks(true);
    
    try {
      // Reduced number of keywords
      const keywords = [
        'Epic',
        'Battle',
        'War',
        'Victory',
        'March'
      ];
      
      setSearchQueries(keywords);
      
      // Process keywords sequentially instead of in parallel
      const allResults = [];
      for (const keyword of keywords) {
        const result = await searchSupabase(keyword);
        if (result.results.length > 0) {
          allResults.push(result);
        }
        // Break early if we have enough tracks
        if (allResults.reduce((sum, r) => sum + r.results.length, 0) >= trackCount) {
          break;
        }
      }
      
      setRawSearchResults(allResults);
      
      // Collect all tracks and deduplicate
      const allTracks: SpotifyTrack[] = [];
      const trackIds = new Set<string>();
      
      allResults.forEach(result => {
        result.results.forEach((track: SpotifyTrack) => {
          if (!trackIds.has(track.id)) {
            trackIds.add(track.id);
            allTracks.push(track);
          }
        });
      });

      // Set statistics
      setTrackStats({
        totalTracks: allTracks.length,
        matchedTracks: allTracks.length,
        matchPercentage: 100,
        matchedIds: Array.from(trackIds)
      });
      
      // Randomize and limit to trackCount
      const randomizedTracks = allTracks
        .sort(() => Math.random() - 0.5)
        .slice(0, trackCount);
      
      setSpotifyTracks(randomizedTracks);
    } catch (error) {
      console.error('Error generating song list:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate song list. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingTracks(false);
    }
  }, [loadedGameRef, toast, trackCount]);

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={8}>
            <Heading as="h1" size="2xl" mb={4} 
              sx={{
                background: "linear-gradient(90deg, #ff00ff 0%, #00bfff 50%, #ff00ff 100%)",
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
              Music Generation Test
            </Heading>
            <Text fontSize="lg" color={useColorModeValue('gray.600', 'gray.400')}>
              Test page to see raw search results for game-based playlists
            </Text>
          </Box>

          {status === 'unauthenticated' && (
            <Alert status="info" borderRadius="md" bg={alertBg} mb={4}>
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Sign in with Spotify</AlertTitle>
                <AlertDescription display="block">
                  Connect your Spotify account to generate music
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

          <SearchBar 
            onSelectGame={handleSelectGame}
            onSearch={handleSearch}
          />

          {selectedGameId && (
            <>
              <Box mt={4} mb={4}>
                <TrackCount 
                  playingTime={loadedGameRef.current?.playingTime ?? 60}
                  value={trackCount}
                  onChange={handleTrackCountChange}
                />
              </Box>

              <Divider my={3} />
              <Flex justifyContent="flex-start" alignItems="center" gap={4} mb={2}>
                <Heading as="h2" size="lg">
                  Game Details
                </Heading>
              </Flex>
              <GameDetails 
                gameId={selectedGameId}
                onGameLoaded={handleGameLoaded}
                actionButton={
                  <Button 
                    colorScheme="blue"
                    onClick={generateSongList}
                    isLoading={isGeneratingTracks}
                    loadingText="Generating Songs..."
                    size="md"
                    bgGradient="linear(to-r, #ff00cc, #3333ff)"
                    _hover={{
                      bgGradient: "linear(to-r, #ff00cc, #3333ff)",
                      opacity: 0.9
                    }}
                    _active={{
                      bgGradient: "linear(to-r, #ff00cc, #3333ff)", 
                      opacity: 0.8
                    }}
                    color="white"
                  >
                    Generate Songs
                  </Button>
                }
              />
              
              <Flex justify="center" mt={8}>
                <Button 
                  colorScheme="blue" 
                  size="lg" 
                  onClick={generateSongList}
                  px={8}
                  isLoading={isGeneratingTracks}
                  loadingText="Generating Songs..."
                  bgGradient="linear(to-r, #ff00cc, #3333ff)"
                  _hover={{
                    bgGradient: "linear(to-r, #ff00cc, #3333ff)",
                    opacity: 0.9
                  }}
                  _active={{
                    bgGradient: "linear(to-r, #ff00cc, #3333ff)", 
                    opacity: 0.8
                  }}
                  color="white"
                >
                  Generate Songs
                </Button>
              </Flex>
            </>
          )}

          {/* Display search queries used */}
          {searchQueries.length > 0 && (
            <Box mt={8}>
              <Heading as="h3" size="md" mb={3}>
                Search Queries Used:
              </Heading>
              <Flex flexWrap="wrap" gap={2}>
                {searchQueries.map((query, index) => (
                  <Badge key={index} colorScheme="blue" p={2} borderRadius="md">
                    {query}
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}

          {/* Add Statistics Display */}
          {trackStats.totalTracks > 0 && (
            <Box mt={8} p={4} borderWidth="1px" borderRadius="lg">
              <Heading as="h3" size="md" mb={4}>
                Track Statistics
              </Heading>
              <StatGroup>
                <Stat>
                  <StatLabel>Total Tracks Found</StatLabel>
                  <StatNumber>{trackStats.totalTracks}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Matches in Database</StatLabel>
                  <StatNumber>{trackStats.matchedTracks}</StatNumber>
                  <StatHelpText>
                    <StatArrow type={trackStats.matchPercentage > 50 ? 'increase' : 'decrease'} />
                    {trackStats.matchPercentage.toFixed(1)}%
                  </StatHelpText>
                </Stat>
              </StatGroup>
            </Box>
          )}

          {/* Display raw search results */}
          {rawSearchResults.length > 0 && (
            <Box mt={8}>
              <Heading as="h3" size="md" mb={3}>
                Raw Search Results:
              </Heading>
              <Accordion allowMultiple>
                {rawSearchResults.map((result, index) => (
                  <AccordionItem key={index}>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          Query: "{result.query}" - {result.results.length} results
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Box maxH="300px" overflowY="auto">
                        <Code display="block" whiteSpace="pre" p={2} fontSize="xs" overflowX="auto">
                          {JSON.stringify(result.results, null, 2)}
                        </Code>
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </Box>
          )}

          {/* Display Spotify tracks */}
          {spotifyTracks.length > 0 && (
            <Box mt={8}>
              <Heading as="h3" size="md" mb={3}>
                Generated Playlist ({spotifyTracks.length} tracks):
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
                {spotifyTracks.map((track) => (
                  <Card key={track.id} overflow="hidden" variant="outline">
                    <CardBody p={3}>
                      <Flex direction="column" height="100%">
                        <Image
                          src={track.album.images[0]?.url || '/album-placeholder.png'}
                          alt={track.name}
                          borderRadius="md"
                          height="160px"
                          objectFit="cover"
                          mb={3}
                        />
                        <Stack spacing={2} flex={1}>
                          <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                            {track.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500" noOfLines={1}>
                            {Array.isArray(track.artists) ? track.artists.map(artist => artist.name).join(', ') : track.artists}
                          </Text>
                          <Text fontSize="xs" color="gray.500" noOfLines={1}>
                            {track.album.name}
                          </Text>
                          <Stack spacing={2} flex={1}>
                            {trackStats.matchedIds.includes(track.id) && (
                              <Badge colorScheme="green" alignSelf="start">
                                In Database
                              </Badge>
                            )}
                          </Stack>
                        </Stack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
} 