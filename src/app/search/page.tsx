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
  Progress,
} from '@chakra-ui/react';
import SearchBar from '@/app/components/search/SearchBar';
import SearchResults from '@/app/components/search/SearchResults';
import GameDetails from '@/app/components/search/GameDetails';
import { SearchResult, BoardGame } from '@/app/types';
import { useAtmosphere } from '@/app/context/atmosphere-context';
import { useRouter } from 'next/navigation';
import { generateMusicRecommendations } from '@/app/lib/ai';
import { useSession, signIn } from 'next-auth/react';
import { FaSpotify } from 'react-icons/fa';

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const { setSelectedGame, setSearchResult, setAiSuggestions, updateSpotifyTracks } = useAtmosphere();
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
    setSelectedGameId(null);
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
    setProgressValue(20);
    setProgressStage('Analyzing game data...');
    
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

      setProgressValue(40);
      setProgressStage('Generating music recommendations...');
      
      // Call the AI service
      const aiResponse = await generateMusicRecommendations(game, atmosphereSettings);

      setProgressValue(70);
      setProgressStage('Processing recommendations...');
      
      // Log both genres and keywords to console for debugging
      console.log('AI suggested genres:', aiResponse.genres || []);
      console.log('AI suggested keywords:', aiResponse.keywords || []);
      
      // Pass the suggestions to the context
      setAiSuggestions(
        aiResponse.genres || [],
        aiResponse.keywords || [],
        aiResponse.explanation || "Generated based on the board game's theme and mechanics."
      );

      setProgressValue(90);
      setProgressStage('Preparing atmosphere page...');
      
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
      // We'll keep the progress bar and loading state until navigation
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
    
    // Start progress
    setProgressValue(10);
    setProgressStage('Initializing Mr Beast...');
    setIsGeneratingAI(true);
    
    // Generate AI suggestions before navigating
    const success = await generateAiSuggestions(game);
    
    // Only navigate if we successfully generated suggestions or the user is authenticated
    if (success || (status === 'authenticated' && session?.user?.accessToken)) {
      setProgressValue(100);
      setProgressStage('Ready! Redirecting...');
      
      // Short delay for UX before navigation
      setTimeout(() => {
        // Navigate to atmosphere page with a query param to trigger auto-search
        router.push('/atmosphere?autoSearch=true');
      }, 500);
    } else {
      setIsGeneratingAI(false);
      setProgressValue(0);
      setProgressStage('');
    }
  }, [router, selectedGameId, generateAiSuggestions, toast, status, session?.user?.accessToken]);

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Progress bar that appears when generating */}
          {isGeneratingAI && (
            <Box position="fixed" top="0" left="0" right="0" zIndex="1000">
              <Progress 
                value={progressValue} 
                size="sm" 
                colorScheme="green" 
                isAnimated
                hasStripe
              />
              <Box 
                bg={useColorModeValue('white', 'gray.800')} 
                p={2} 
                textAlign="center"
                borderBottomWidth="1px"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
              >
                <Text fontSize="sm" fontWeight="medium">{progressStage}</Text>
              </Box>
            </Box>
          )}
          
          <Box textAlign="center" mb={8}>
            <Heading as="h1" size="2xl" mb={4} color={textColor}>
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
          />

          {searchResults.length > 0 && !selectedGameId && (
            <>
              <Divider my={6} />
              <Heading as="h2" size="lg" mb={4}>
                Search Results
              </Heading>
              <SearchResults 
                results={searchResults}
                isLoading={isLoading}
                onSelectGame={handleSelectGame}
              />
            </>
          )}

          {selectedGameId && (
            <>
              <Divider my={6} />
              <Heading as="h2" size="lg" mb={4}>
                Game Details
              </Heading>
              <GameDetails 
                gameId={selectedGameId}
                onGameLoaded={handleGameLoaded}
              />
              <Flex justify="center" mt={8}>
                <Button 
                  colorScheme="blue" 
                  size="lg" 
                  onClick={handleContinue}
                  px={8}
                  isLoading={isGeneratingAI}
                  loadingText={progressStage || "Generating Game Atmosphere..."}
                  disabled={isGeneratingAI}
                >
                  Invoke Mr Beast!
                </Button>
              </Flex>
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
} 