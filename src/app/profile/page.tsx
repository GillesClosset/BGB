'use client';

import React, { useEffect, useState } from 'react';
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
  Badge,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
  Input,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaSpotify, FaMusic } from 'react-icons/fa';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast({
        title: 'Feedback is empty',
        description: 'Please enter your feedback before submitting.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call for feedback submission
    setTimeout(() => {
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setFeedback('');
      setIsSubmitting(false);
    }, 1000);
    
    // In a real application, you would send this to your backend
    // const response = await fetch('/api/feedback', {
    //   method: 'POST',
    //   body: JSON.stringify({ feedback, userId: session?.user?.id }),
    //   headers: { 'Content-Type': 'application/json' }
    // });
  };
  
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
                borderRadius="full"
                bgColor="#1DB954"
                _hover={{ bgColor: "#1ED760" }}
                _active={{ bgColor: "#1AA64B" }}
                fontWeight="bold"
                boxShadow="md"
              >
                Create New Playlist
              </Button>
            </VStack>
          </Flex>
          
          {/* Stats Section */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Stat
              bg={cardBg}
              p={6}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              shadow="md"
            >
              <Flex align="center" gap={2}>
                <StatLabel>Created Playlists</StatLabel>
                <Text as="span" fontSize="xs" fontStyle="italic" color="gray.500">
                  work in progress
                </Text>
              </Flex>
              <StatNumber>0</StatNumber>
              <StatHelpText>Start creating playlists for your games</StatHelpText>
            </Stat>
            
            <Box
              bg={cardBg}
              p={6}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              shadow="md"
            >
              <VStack align="stretch" spacing={4}>
                <Flex align="center" gap={2}>
                  <Heading size="md">Share Your Feedback</Heading>
                  <Text as="span" fontSize="xs" fontStyle="italic" color="gray.500">
                    work in progress
                  </Text>
                </Flex>
                <Text fontSize="sm" color="gray.500">
                  We'd love to hear your thoughts on how we can improve the app!
                </Text>
                
                <FormControl>
                  <Textarea
                    placeholder="Your feedback is valuable to us..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    size="md"
                    resize="vertical"
                    minH="100px"
                  />
                </FormControl>
                
                <Button
                  colorScheme="blue"
                  isLoading={isSubmitting}
                  loadingText="Submitting"
                  onClick={handleSubmitFeedback}
                  bg="blue.600"
                  _hover={{ bg: "blue.700" }}
                >
                  Submit Feedback
                </Button>
              </VStack>
            </Box>
          </SimpleGrid>
          
          {/* Pro Section */}
          <Box
            bg={cardBg}
            p={6}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="md"
          >
            <VStack align="stretch" spacing={6}>
              <Heading size="lg">Pro</Heading>
              
              <Text>
                By being a Pro User, you're primarily helping us keep the app running and improving. 
                As a thank you, you'll also gain access to these exclusive features below!
              </Text>
              
              <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={4}>
                <Button 
                  isDisabled={true}
                  colorScheme="blue"
                  bg="blue.600"
                  _hover={{ bg: "blue.700" }}
                  size="lg"
                >
                  Switch to Pro
                </Button>
                <Text fontWeight="medium" color="gray.500">Coming Soon</Text>
              </Flex>
              
              <Divider />
              
              <VStack align="stretch" spacing={4}>
                <Flex align="center" gap={2}>
                  <Heading size="md">Ordering of the playlist to get more tensed toward the end (like your games!)</Heading>
                  <Badge colorScheme="blue">pro only</Badge>
                </Flex>
                
                <Flex align="center" gap={2}>
                  <Heading size="md">Your Games Library</Heading>
                  <Badge colorScheme="blue">pro only</Badge>
                </Flex>
                
                <Flex align="center" gap={2}>
                  <Heading size="md">Excluded Music Genres</Heading>
                  <Badge colorScheme="blue">pro only</Badge>
                </Flex>
                
                <Flex align="center" gap={2}>
                  <Heading size="md">Saved Playlists</Heading>
                  <Badge colorScheme="blue">pro only</Badge>
                </Flex>
                
                <Flex align="center" gap={2}>
                  <Heading size="md">Editable Playlists and Full Preview</Heading>
                  <Badge colorScheme="blue">pro only</Badge>
                </Flex>
              </VStack>
            </VStack>
          </Box>
          
          {/* Future: Recent Activity, Saved Playlists, etc. */}
        </VStack>
      </Container>
    </Box>
  );
} 