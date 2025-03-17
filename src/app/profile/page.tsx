'use client';

import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Divider,
  useColorModeValue,
  Button,
  SimpleGrid,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaSpotify, FaMusic } from 'react-icons/fa';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
  if (status === 'loading') {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={bgColor}>
        <Text>Loading profile...</Text>
      </Flex>
    );
  }
  
  if (!session) {
    return null; // Will be redirected by the useEffect
  }
  
  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          {/* Profile Header */}
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'center', md: 'flex-start' }}
            bg={cardBg}
            p={6}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="md"
            gap={6}
          >
            <Avatar 
              size="2xl" 
              src={session.user?.image || undefined} 
              name={session.user?.name || 'User'} 
            />
            
            <VStack align={{ base: 'center', md: 'flex-start' }} spacing={3} flex="1">
              <Heading size="lg">{session.user?.name}</Heading>
              <Text color="gray.500">{session.user?.email}</Text>
              
              <HStack mt={2}>
                <Icon as={FaSpotify} color="green.500" />
                <Text fontWeight="medium">Spotify Connected</Text>
              </HStack>
              
              <Button 
                leftIcon={<Icon as={FaMusic} />} 
                colorScheme="green"
                size="sm"
                onClick={() => router.push('/search')}
                mt={4}
              >
                Create New Playlist
              </Button>
            </VStack>
          </Flex>
          
          {/* Stats Section */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Stat
              bg={cardBg}
              p={6}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              shadow="md"
            >
              <StatLabel>Created Playlists</StatLabel>
              <StatNumber>0</StatNumber>
              <StatHelpText>Start creating playlists for your games</StatHelpText>
            </Stat>
            
            <Stat
              bg={cardBg}
              p={6}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              shadow="md"
            >
              <StatLabel>Games Explored</StatLabel>
              <StatNumber>0</StatNumber>
              <StatHelpText>Browse games to increase this number</StatHelpText>
            </Stat>
            
            <Stat
              bg={cardBg}
              p={6}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              shadow="md"
            >
              <StatLabel>Music Genres</StatLabel>
              <StatNumber>0</StatNumber>
              <StatHelpText>Genres used in your playlists</StatHelpText>
            </Stat>
          </SimpleGrid>
          
          {/* Future: Recent Activity, Saved Playlists, etc. */}
        </VStack>
      </Container>
    </Box>
  );
} 