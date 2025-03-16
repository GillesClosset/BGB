'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Avatar,
  Flex,
  Button,
  Divider,
  Spinner,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
} from '@chakra-ui/react';
import { FaSpotify } from 'react-icons/fa';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  // Handle Spotify sign in
  const handleSignIn = useCallback(async () => {
    try {
      await signIn('spotify', { callbackUrl: '/profile' });
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
        description: 'Please sign in with Spotify to view your profile',
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
            <Text>Loading your profile...</Text>
          </Flex>
        </Container>
      </MainLayout>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <MainLayout>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            <Heading as="h1" size="xl">
              Your Profile
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
                    Sign in with Spotify to view and manage your profile
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

            <VStack spacing={8} align="center" justify="center" minH="40vh" bg={bgColor} p={6} borderRadius="lg" shadow="md">
              <Avatar
                size="2xl"
                name="Guest User"
                src="/images/default-avatar.png"
              />
              <Heading as="h2" size="lg">
                Sign In Required
              </Heading>
              <Text fontSize="lg" textAlign="center">
                Please sign in with your Spotify account to view your profile and create custom playlists.
              </Text>
              <Button
                size="lg"
                colorScheme="green"
                leftIcon={<FaSpotify />}
                onClick={handleSignIn}
              >
                Sign in with Spotify
              </Button>
            </VStack>
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
            Your Profile
          </Heading>

          <Box bg={bgColor} p={6} borderRadius="lg" shadow="md">
            <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={6}>
              <Avatar
                size="2xl"
                name={session?.user?.name || 'User'}
                src={session?.user?.image || undefined}
              />
              <VStack align="flex-start" spacing={3}>
                <Heading as="h2" size="lg">
                  {session?.user?.name || 'Spotify User'}
                </Heading>
                <Text>{session?.user?.email || 'No email available'}</Text>
                <Text color="green.500" fontWeight="bold">
                  Spotify Account Connected
                </Text>
              </VStack>
            </Flex>

            <Divider my={6} />

            <VStack align="stretch" spacing={4}>
              <Heading as="h3" size="md">
                Account Information
              </Heading>
              <Text>
                You've successfully connected your Spotify account to BoardGame Beats.
              </Text>
              <Text>
                You can now create custom playlists for your board game sessions.
              </Text>

              <Flex gap={4} mt={4}>
                <Button
                  colorScheme="blue"
                  onClick={() => router.push('/search')}
                >
                  Find Board Games
                </Button>
                <Button
                  variant="outline"
                  colorScheme="green"
                  leftIcon={<FaSpotify />}
                  onClick={() => router.push('/playlists')}
                >
                  View Your Playlists
                </Button>
              </Flex>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </MainLayout>
  );
} 