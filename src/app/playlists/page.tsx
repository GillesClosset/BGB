'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  Stack,
  Divider,
  CardFooter,
  Button,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { FaSpotify, FaPlay } from 'react-icons/fa';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';

export default function PlaylistsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

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

  // Check for authentication errors
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in with Spotify to view your playlists',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [status, toast]);

  // Loading state
  if (status === 'loading') {
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" minH="50vh" direction="column">
            <Spinner size="xl" color="brand.500" mb={4} />
            <Text>Loading your playlists...</Text>
          </Flex>
        </Container>
      </MainLayout>
    );
  }

  // Unauthenticated state - show sign-in prompt instead of redirecting
  if (status === 'unauthenticated') {
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            <Heading as="h1" size="xl">
              Your Board Game Playlists
            </Heading>
            
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
                    Sign in with Spotify to view and manage your playlists
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

            <Flex justify="center" align="center" minH="40vh" direction="column">
              <Text fontSize="lg" mb={6}>
                You need to be signed in with Spotify to view your playlists.
              </Text>
              <Button
                colorScheme="green"
                size="lg"
                leftIcon={<FaSpotify />}
                onClick={handleSignIn}
              >
                Sign in with Spotify
              </Button>
            </Flex>
          </VStack>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl">
            Your Board Game Playlists
          </Heading>
          <Text fontSize="lg">
            View and manage your custom Spotify playlists created for board games.
          </Text>

          {/* Placeholder for when no playlists exist */}
          <Box py={10} textAlign="center">
            <Text fontSize="lg" mb={6}>
              You haven't created any board game playlists yet.
            </Text>
            <Button
              colorScheme="brand"
              size="lg"
              leftIcon={<FaSpotify />}
              onClick={() => router.push('/search')}
            >
              Create Your First Playlist
            </Button>
          </Box>

          {/* This will be populated with actual playlists later */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} display="none">
            {/* Example playlist card */}
            <Card maxW="sm">
              <CardBody>
                <Image
                  src="https://via.placeholder.com/300x300?text=Playlist+Cover"
                  alt="Playlist cover"
                  borderRadius="lg"
                />
                <Stack mt="6" spacing="3">
                  <Heading size="md">Catan Vibes</Heading>
                  <Text>A relaxing soundtrack for your Settlers of Catan sessions.</Text>
                  <Text color="brand.600" fontSize="sm">
                    15 tracks • 45 minutes
                  </Text>
                </Stack>
              </CardBody>
              <Divider />
              <CardFooter>
                <Button variant="solid" colorScheme="brand" leftIcon={<FaPlay />} flex="1">
                  Play on Spotify
                </Button>
              </CardFooter>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>
    </MainLayout>
  );
} 