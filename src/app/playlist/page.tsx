'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useColorModeValue,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Image,
  Badge,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useAtmosphere } from '@/app/context/atmosphere-context';
import { getRecommendations, createPlaylist, addTracksToPlaylist } from '@/app/lib/spotify';
import { SpotifyTrack } from '@/app/types';
import { useSession } from 'next-auth/react';

export default function PlaylistPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { selectedGame, selectedGenres, trackCount, spotifyTracks } = useAtmosphere();
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPlaylistUrl, setSavedPlaylistUrl] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const descriptionTextColor = useColorModeValue('gray.600', 'gray.400');

  // Redirect to atmosphere if no game is selected
  useEffect(() => {
    if (!selectedGame) {
      router.push('/atmosphere');
      return;
    }

    // Generate playlist on component mount
    generatePlaylist();
  }, [selectedGame, router]);

  const generatePlaylist = async () => {
    if (!selectedGame || !session?.user?.accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use default audio features since they're not in the context
      const params: Record<string, number> = {
        limit: trackCount,
        // Default audio features values
        target_acousticness: 0.5,
        target_danceability: 0.5,
        target_energy: 0.5,
        target_instrumentalness: 0.5,
        target_liveness: 0.5,
        target_loudness: -10,
        target_speechiness: 0.2,
        target_tempo: 120,
        target_valence: 0.5,
      };

      // Get recommendations from Spotify
      const recommendations = await getRecommendations(
        [], // seed tracks
        [], // seed artists
        selectedGenres.slice(0, 5), // seed genres (max 5)
        params
      );

      // Convert the Spotify API response to our SpotifyTrack type
      const formattedTracks: SpotifyTrack[] = recommendations.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => ({ id: artist.id, name: artist.name })),
        album: {
          id: track.album.id,
          name: track.album.name,
          images: track.album.images.map(image => ({
            url: image.url,
            height: image.height || 0,
            width: image.width || 0
          }))
        },
        duration_ms: track.duration_ms,
        uri: track.uri
      }));

      setTracks(formattedTracks);
    } catch (err) {
      console.error('Error generating playlist:', err);
      setError('Failed to generate playlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlaylist = async () => {
    if (!selectedGame || !session?.user?.id || !session?.user?.accessToken || spotifyTracks.length === 0) return;

    setIsSaving(true);

    try {
      // Create playlist name and description
      const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const playlistName = `${selectedGame.name} by BoardGame Beats - ${currentDate}`;
      const playlistDescription = `A custom soundtrack for ${selectedGame.name} - Created with BoardGame Beats`;

      // Create a new playlist
      const playlist = await createPlaylist(
        session.user.id,
        playlistName,
        playlistDescription
      );

      // Add tracks to the playlist
      await addTracksToPlaylist(
        playlist.id,
        spotifyTracks.map(track => track.uri)
      );

      // Save the playlist URL for the user to open
      setSavedPlaylistUrl(playlist.external_urls.spotify);

      toast({
        title: 'Playlist saved!',
        description: 'Your custom soundtrack has been saved to your Spotify account.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error saving playlist:', err);
      toast({
        title: 'Error saving playlist',
        description: 'Failed to save playlist to your Spotify account. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegeneratePlaylist = () => {
    generatePlaylist();
  };

  if (!selectedGame) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <AlertTitle>No game selected!</AlertTitle>
            <AlertDescription>
              Please select a board game and customize its atmosphere first.
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
          <Box textAlign="center" mb={4}>
            <Heading as="h1" size="2xl" mb={4} color={textColor}>
              Your {selectedGame.name} Soundtrack
            </Heading>
            <Text fontSize="lg" color={descriptionTextColor}>
              A custom playlist based on your game&apos;s atmosphere
            </Text>
          </Box>

          {isLoading ? (
            <Flex direction="column" align="center" justify="center" py={12}>
              <Spinner size="xl" color="blue.500" thickness="4px" mb={4} />
              <Text fontSize="lg">Generating your custom soundtrack...</Text>
            </Flex>
          ) : error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                {spotifyTracks.map((track) => (
                  <Box
                    key={track.id}
                    borderWidth="1px"
                    borderRadius="lg"
                    overflow="hidden"
                    bg={cardBg}
                    borderColor={borderColor}
                    transition="all 0.3s"
                    _hover={{ transform: 'translateY(-5px)', shadow: 'md' }}
                    height="100%"
                    display="flex"
                    flexDirection="column"
                  >
                    <Image
                      src={track.album.images[0]?.url || 'https://via.placeholder.com/300'}
                      alt={track.name}
                      height="200px"
                      width="100%"
                      objectFit="cover"
                    />
                    <Box p={4} flex="1" display="flex" flexDirection="column">
                      <Heading size="sm" mb={2} noOfLines={1} color={textColor}>
                        {track.name}
                      </Heading>
                      <Text fontSize="sm" color="gray.500" mb={2} noOfLines={1}>
                        {track.artists.map(artist => artist.name).join(', ')}
                      </Text>
                      <Text fontSize="xs" color="gray.500" mb={2} noOfLines={1}>
                        {track.album.name}
                      </Text>
                      <Flex mt="auto">
                        <Badge colorScheme="green">
                          {Math.floor(track.duration_ms / 60000)}:
                          {Math.floor((track.duration_ms % 60000) / 1000)
                            .toString()
                            .padStart(2, '0')}
                        </Badge>
                      </Flex>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>

              <Divider my={6} />

              <Flex justify="center" gap={4} wrap="wrap">
                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={handleSavePlaylist}
                  isLoading={isSaving}
                  loadingText="Saving..."
                  isDisabled={!session?.user?.id || spotifyTracks.length === 0}
                >
                  Save to Spotify
                </Button>
                <Button
                  colorScheme="purple"
                  size="lg"
                  onClick={handleRegeneratePlaylist}
                  isDisabled={isLoading}
                >
                  Regenerate Playlist
                </Button>
                {savedPlaylistUrl && (
                  <Button
                    as="a"
                    href={savedPlaylistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    colorScheme="green"
                    size="lg"
                  >
                    Open in Spotify
                  </Button>
                )}
              </Flex>
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
} 