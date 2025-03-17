'use client';

import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  Image,
  Flex,
  useColorModeValue,
  SimpleGrid,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FaMusic, FaDice, FaSpotify } from 'react-icons/fa';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleGetStarted = () => {
    if (status === 'authenticated' && session?.user?.accessToken) {
      router.push('/search');
    } else {
      signIn('spotify', { callbackUrl: '/search' });
    }
  };

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Hero Section */}
      <Box 
        bg={useColorModeValue('blue.600', 'blue.900')} 
        color="white" 
        py={20} 
        px={4}
      >
        <Container maxW="container.xl">
          <Flex 
            direction={{ base: 'column', lg: 'row' }} 
            align="center" 
            justify="space-between"
            gap={10}
          >
            <VStack align="flex-start" spacing={6} maxW="600px">
              <Heading as="h1" size="3xl" lineHeight="1.2">
                BoardGame Beats
              </Heading>
              <Text fontSize="xl">
                Create the perfect Spotify playlist for your board game night. 
                Match the music to your game&apos;s theme, mood, and intensity.
              </Text>
              <Button 
                size="lg" 
                colorScheme="green" 
                leftIcon={<Icon as={FaSpotify} boxSize={5} />}
                onClick={handleGetStarted}
                px={8}
                py={6}
                fontSize="lg"
                borderRadius="full"
                bgColor="#1DB954"
                _hover={{ bgColor: "#1ED760" }}
                _active={{ bgColor: "#1AA64B" }}
                fontWeight="bold"
                boxShadow="md"
              >
                {status === 'authenticated' ? 'Get Started' : 'Connect with Spotify'}
              </Button>
            </VStack>
            
            <Box 
              boxSize={{ base: '300px', md: '400px' }}
              position="relative"
            >
              <Image 
                src="/images/hero-image_small.jpg" 
                alt="Board games and music" 
                fallbackSrc="https://placehold.co/400x400/1DB954/FFFFFF?text=BoardGame+Beats"
                borderRadius="lg"
                shadow="2xl"
                objectFit="cover"
              />
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box py={20} px={4}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <Heading as="h2" size="xl" textAlign="center" mb={4}>
              How It Works
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
              <Box 
                p={6} 
                bg={cardBg} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor={borderColor}
                shadow="md"
                textAlign="center"
              >
                <Icon as={FaDice} boxSize={12} color="blue.500" mb={4} />
                <Heading as="h3" size="md" mb={4}>
                  1. Choose Your Game
                </Heading>
                <Text color={useColorModeValue('gray.600', 'gray.400')}>
                  Search for your favorite board game from our extensive database.
                </Text>
              </Box>
              
              <Box 
                p={6} 
                bg={cardBg} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor={borderColor}
                shadow="md"
                textAlign="center"
              >
                <Icon as={FaMusic} boxSize={12} color="purple.500" mb={4} />
                <Heading as="h3" size="md" mb={4}>
                  2. Customize Atmosphere
                </Heading>
                <Text color={useColorModeValue('gray.600', 'gray.400')}>
                  Adjust musical parameters or use our AI to suggest the perfect atmosphere.
                </Text>
              </Box>
              
              <Box 
                p={6} 
                bg={cardBg} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor={borderColor}
                shadow="md"
                textAlign="center"
              >
                <Icon as={FaSpotify} boxSize={12} color="green.500" mb={4} />
                <Heading as="h3" size="md" mb={4}>
                  3. Generate Playlist
                </Heading>
                <Text color={useColorModeValue('gray.600', 'gray.400')}>
                  Save your custom soundtrack to Spotify and enhance your gaming experience.
                </Text>
              </Box>
            </SimpleGrid>
            
            <Button 
              size="lg" 
              colorScheme="green" 
              leftIcon={<Icon as={FaSpotify} boxSize={5} />}
              onClick={handleGetStarted}
              mt={8}
              px={8}
              py={6}
              fontSize="lg"
              borderRadius="full"
              bgColor="#1DB954"
              _hover={{ bgColor: "#1ED760" }}
              _active={{ bgColor: "#1AA64B" }}
              fontWeight="bold"
              boxShadow="md"
            >
              {status === 'authenticated' ? 'Get Started' : 'Connect with Spotify'}
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Disclaimer Footer */}
      <Box py={6} px={4} borderTopWidth="1px" borderColor={borderColor}>
        <Container maxW="container.xl">
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" gap={4}>
            <Text 
              fontSize="sm" 
              color={useColorModeValue('gray.500', 'gray.400')} 
            >
              Not affiliated with Spotify or BoardGameGeek. Created for board game enthusiasts. AI powered by OVHcloud AI Endpoints
            </Text>
            
            {status === 'authenticated' ? (
              <HStack spacing={4}>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => router.push('/profile')}
                >
                  Profile
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign Out
                </Button>
              </HStack>
            ) : null}
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
