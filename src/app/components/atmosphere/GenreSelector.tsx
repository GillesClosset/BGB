'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Select,
  Tag,
  TagLabel,
  TagCloseButton,
  Flex,
  Text,
  Spinner,
  useColorModeValue,
  Heading,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { getAvailableGenres } from '@/app/lib/spotify';
import { useAtmosphere } from '@/app/context/atmosphere-context';

interface GenreSelectorProps {
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
  aiSuggestedGenres?: string[];
  maxGenres?: number;
}

const GenreSelector: React.FC<GenreSelectorProps> = ({
  selectedGenres,
  onChange,
  aiSuggestedGenres = [],
  maxGenres = 5,
}) => {
  const { retrievedGenres } = useAtmosphere();
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('');

  const toast = useToast();
  const tagBg = useColorModeValue('gray.100', 'gray.700');
  const aiTagBg = useColorModeValue('purple.100', 'purple.800');
  const tagTextColor = useColorModeValue('gray.800', 'white');

  // Load available genres on component mount or when retrievedGenres changes
  useEffect(() => {
    const loadGenres = async () => {
      setIsLoading(true);
      try {
        // Prioritize retrievedGenres from vector search if available
        if (retrievedGenres && retrievedGenres.length > 0) {
          console.log('Using retrieved genres from vector search:', retrievedGenres.length);
          setAvailableGenres(retrievedGenres);
        } else {
          // Fallback to localStorage or static list
          const cachedGenres = localStorage.getItem('spotifyAvailableGenres');
          
          if (cachedGenres) {
            setAvailableGenres(JSON.parse(cachedGenres));
          } else {
            // As a last resort, get the static genres list
            const genres = await getAvailableGenres();
            setAvailableGenres(genres);
            // Cache the genres in localStorage
            localStorage.setItem('spotifyAvailableGenres', JSON.stringify(genres));
          }
        }
      } catch (error) {
        console.error('Error loading genres:', error);
        // Fallback to some common genres
        setAvailableGenres([
          'rock', 'pop', 'electronic', 'classical', 'jazz', 'hip-hop', 
          'indie', 'ambient', 'folk', 'metal', 'r&b', 'soul', 'blues'
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGenres();
  }, [retrievedGenres]);

  // Function to handle genre selection
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const genre = e.target.value;
    if (!genre) return;
    
    setSelectedGenre(''); // Reset select after selection
    
    if (selectedGenres.length >= maxGenres) {
      toast({
        title: "Maximum genres reached",
        description: `You can only select up to ${maxGenres} genres.`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    if (!selectedGenres.includes(genre)) {
      const newGenres = [...selectedGenres, genre];
      onChange(newGenres);
    }
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    const newGenres = selectedGenres.filter(genre => genre !== genreToRemove);
    onChange(newGenres);
  };

  // Check if a genre was AI suggested
  const isAiSuggested = (genre: string) => {
    return aiSuggestedGenres.includes(genre);
  };

  return (
    <Box>
      <Heading size="md" mb={3}>Music Genres</Heading>
      
      {/* Selected Genres */}
      <Flex wrap="wrap" gap={2} mb={4}>
        {selectedGenres.map(genre => (
          <Tag 
            key={genre} 
            size="lg" 
            borderRadius="full" 
            variant="solid" 
            bg={isAiSuggested(genre) ? aiTagBg : tagBg}
            color={tagTextColor}
          >
            <TagLabel>{genre}</TagLabel>
            <TagCloseButton onClick={() => handleRemoveGenre(genre)} />
            {isAiSuggested(genre) && (
              <Badge ml={1} colorScheme="purple" fontSize="xs">AI</Badge>
            )}
          </Tag>
        ))}
      </Flex>
      
      {/* Genre Dropdown */}
      {selectedGenres.length < maxGenres && (
        <Box>
          {isLoading ? (
            <Flex align="center">
              <Spinner size="sm" mr={2} />
              <Text>Loading genres...</Text>
            </Flex>
          ) : (
            <Select 
              placeholder="Pick another suggestion from Mr Beats"
              value={selectedGenre}
              onChange={handleSelectChange}
              isDisabled={availableGenres.length === 0}
            >
              {availableGenres
                .filter(genre => !selectedGenres.includes(genre))
                .sort((a, b) => a.localeCompare(b))
                .map(genre => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))
              }
            </Select>
          )}
        </Box>
      )}
      
      {/* Helper Text */}
      <Text fontSize="sm" color="gray.500" mt={2}>
        {selectedGenres.length === 0 
          ? 'Select up to 5 genres from the dropdown to customize your playlist' 
          : selectedGenres.length >= maxGenres 
            ? 'Maximum number of genres reached' 
            : `${maxGenres - selectedGenres.length} more genres can be added`}
      </Text>
    </Box>
  );
};

export default GenreSelector; 