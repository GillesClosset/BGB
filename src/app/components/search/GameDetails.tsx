'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Image,
  Text,
  Heading,
  Flex,
  Badge,
  Spinner,
  Grid,
  GridItem,
  Divider,
  Tag,
  TagLabel,
  TagLeftIcon,
  HStack,
  useColorModeValue,
  Button,
} from '@chakra-ui/react';
import { TimeIcon, StarIcon, InfoIcon, PlusSquareIcon } from '@chakra-ui/icons';
import { BoardGame } from '@/app/types';
import { getBoardGameDetails } from '@/app/lib/boardgames';

interface GameDetailsProps {
  gameId: string;
  onGameLoaded: (game: BoardGame) => void;
  titleRightContent?: React.ReactNode;
}

const GameDetails: React.FC<GameDetailsProps> = ({ gameId, onGameLoaded, titleRightContent }) => {
  const [game, setGame] = useState<BoardGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const descriptionColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    const fetchGameDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const gameDetails = await getBoardGameDetails(gameId);
        setGame(gameDetails);
        
        // Only call onGameLoaded once per gameId to prevent infinite loops
        if (!hasLoadedRef.current) {
          onGameLoaded(gameDetails);
          hasLoadedRef.current = true;
        }
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('Failed to load game details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (gameId) {
      // Reset the ref when gameId changes
      hasLoadedRef.current = false;
      fetchGameDetails();
    }
  }, [gameId, onGameLoaded]);

  // Function to sanitize HTML in description
  const sanitizeDescription = (html: string) => {
    // Create a temporary div element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get the text content
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  if (error || !game) {
    return (
      <Box textAlign="center" p={6} bg="red.50" borderRadius="md">
        <InfoIcon boxSize={10} color="red.500" mb={4} />
        <Heading size="md" mb={2}>Error Loading Game</Heading>
        <Text>{error || 'Game not found'}</Text>
        <Button mt={4} colorScheme="blue" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  // Placeholder image for games without images
  const placeholderImage = 'https://via.placeholder.com/400x400?text=No+Image';

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      overflow="hidden"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="md"
    >
      <Grid templateColumns={{ base: '1fr', md: 'minmax(300px, 1fr) 2fr' }} gap={6}>
        {/* Game Image */}
        <GridItem>
          <Box p={4}>
            <Image
              src={game.image || placeholderImage}
              alt={game.name}
              borderRadius="md"
              width="100%"
              height="auto"
              maxH="400px"
              objectFit="contain"
              fallbackSrc={placeholderImage}
            />
            
            {/* Game Stats */}
            <Box mt={6}>
              <HStack spacing={4} mb={3}>
                <Tag size="lg" colorScheme="blue" borderRadius="full">
                  <TagLeftIcon boxSize="12px" as={TimeIcon} />
                  <TagLabel>{game.playingTime} min</TagLabel>
                </Tag>
                
                <Tag size="lg" colorScheme="yellow" borderRadius="full">
                  <TagLeftIcon boxSize="12px" as={StarIcon} />
                  <TagLabel>{game.rating.toFixed(1)}</TagLabel>
                </Tag>
              </HStack>
              
              <HStack spacing={4}>
                <Tag size="md" colorScheme="green" borderRadius="full">
                  <TagLabel>{game.minPlayers}-{game.maxPlayers} Players</TagLabel>
                </Tag>
                
                <Tag size="md" colorScheme="purple" borderRadius="full">
                  <TagLabel>{game.year}</TagLabel>
                </Tag>
              </HStack>
            </Box>
          </Box>
        </GridItem>
        
        {/* Game Details */}
        <GridItem p={6}>
          <Flex alignItems="center" mb={2}>
            <Heading as="h2" size="xl" color={textColor}>
              {game.name}
            </Heading>
            {titleRightContent && (
              <Box ml={4}>
                {titleRightContent}
              </Box>
            )}
          </Flex>
          
          <Flex mb={4} wrap="wrap">
            <Text fontWeight="bold" mr={2}>Designer:</Text>
            <Text color={descriptionColor}>{game.designer}</Text>
            <Text mx={2} color="gray.500">•</Text>
            <Text fontWeight="bold" mr={2}>Publisher:</Text>
            <Text color={descriptionColor}>{game.publisher}</Text>
          </Flex>
          
          <Divider my={4} />
          
          {/* Game Description */}
          <Box mb={6}>
            <Heading as="h3" size="md" mb={3} color={textColor}>
              Description
            </Heading>
            <Text color={descriptionColor} whiteSpace="pre-line">
              {sanitizeDescription(game.description)}
            </Text>
          </Box>
          
          {/* Categories and Mechanics sections removed to improve user experience */}
        </GridItem>
      </Grid>
    </Box>
  );
};

export default GameDetails; 