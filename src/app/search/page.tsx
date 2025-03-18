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
} from '@chakra-ui/react';
import SearchBar from '@/app/components/search/SearchBar';
import SearchResults from '@/app/components/search/SearchResults';
import GameDetails from '@/app/components/search/GameDetails';
import TrackCount from '@/app/components/atmosphere/TrackCount';
import { SearchResult } from '@/app/types/index';
import { BoardGame } from '@/app/types';
import { useAtmosphere } from '@/app/context/atmosphere-context';
import { useRouter } from 'next/navigation';
import { generateMusicRecommendations } from '@/app/lib/ai';
import { useSession, signIn } from 'next-auth/react';
import { FaSpotify } from 'react-icons/fa';

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const { 
    setSelectedGame, 
    setSearchResult, 
    setAiSuggestions, 
    updateSpotifyTracks,
    trackCount,
    updateTrackCount
  } = useAtmosphere();
  const router = useRouter();
  const toast = useToast();
  const { data: session, status } = useSession();
  const loadedGameRef = useRef<BoardGame | null>(null);
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const alertBg = useColorModeValue('blue.50', 'blue.900');

  // Check authentication status when the component mounts
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast({
        title: 'Authentication Required',
        description: 'You need to sign in with Spotify to create playlists',
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

  const generateAiSuggestions = useCallback(async (game: BoardGame) => {
    if (!game) return;
    
    // Check if user is authenticated
    if (status !== 'authenticated' || !session?.user?.accessToken) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in with Spotify to generate music recommendations',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    
    setIsGeneratingAI(true);
    
    try {
      // Create a simple atmosphere settings object for the AI
      const atmosphereSettings = {
        tempo: 50,
        energy: 50,
        complexity: 50,
        mood: 'neutral',
        genres: [],
        era: 'modern',
      };

      // Call the AI service
      const aiResponse = await generateMusicRecommendations(game, atmosphereSettings);

      // Log both genres and keywords to console for debugging
      console.log('AI suggested genres:', aiResponse.genres || []);
      console.log('AI suggested keywords:', aiResponse.keywords || []);
      
      // Pass the suggestions to the context
      setAiSuggestions(
        aiResponse.genres || [],
        aiResponse.keywords || [],
        aiResponse.explanation || "Generated based on the board game's theme and mechanics."
      );

      return true;
    } catch (err) {
      console.error('Error generating AI suggestions:', err);
      toast({
        title: 'AI Generation Info',
        description: 'We\'ll use default music suggestions for this game.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      return false;
    } finally {
      setIsGeneratingAI(false);
    }
  }, [setAiSuggestions, toast, session?.user?.accessToken, status]);

  const handleContinue = useCallback(async () => {
    if (!selectedGameId) return;
    
    // Get the selected game from our ref
    const game = loadedGameRef.current;
    
    if (!game) {
      toast({
        title: 'Game Not Loaded',
        description: 'Please wait for the game details to load before continuing.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Check authentication status
    if (status !== 'authenticated' || !session?.user?.accessToken) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in with Spotify to continue',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsNavigating(true);
    
    // Generate AI suggestions before navigating
    const success = await generateAiSuggestions(game);
    
    // Only navigate if we successfully generated suggestions or the user is authenticated
    if (success || (status === 'authenticated' && session?.user?.accessToken)) {
      // Navigate to atmosphere page
      router.push('/atmosphere');
    } else {
      setIsNavigating(false);
    }
  }, [router, selectedGameId, generateAiSuggestions, toast, status, session?.user?.accessToken]);

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={8}>
            <Heading as="h1" size="2xl" mb={4} 
              sx={{
                background: "linear-gradient(90deg, #ff00ff 0%, #00bfff 100%)",
                backgroundClip: "text",
                textFillColor: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block"
              }}
            >
              Find Your Board Game
            </Heading>
            <Text fontSize="lg" color={useColorModeValue('gray.600', 'gray.400')}>
              Search for a board game to create a matching playlist
            </Text>
          </Box>

          {status === 'unauthenticated' && (
            <Alert status="info" borderRadius="md" bg={alertBg} mb={4}>
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Sign in with Spotify</AlertTitle>
                <AlertDescription display="block">
                  Connect your Spotify account to create custom playlists for your board games
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
                  playingTime={loadedGameRef.current?.stats?.playingTime ?? loadedGameRef.current?.playingTime ?? 60}
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
                    onClick={handleContinue}
                    isLoading={isGeneratingAI || isNavigating}
                    loadingText="Invoking Mr Beats!"
                    size="md"
                  >
                    Invoke Mr Beats!
                  </Button>
                }
              />
              
              <Flex justify="center" mt={8}>
                <Button 
                  colorScheme="blue" 
                  size="lg" 
                  onClick={handleContinue}
                  px={8}
                  isLoading={isGeneratingAI || isNavigating}
                  loadingText="Invoking Mr Beats!"
                >
                  Invoke Mr Beats!
                </Button>
              </Flex>
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
} 