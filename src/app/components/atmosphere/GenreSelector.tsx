'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputRightElement,
  Tag,
  TagLabel,
  TagCloseButton,
  Flex,
  List,
  ListItem,
  Text,
  Spinner,
  useColorModeValue,
  Heading,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { getAvailableGenres } from '@/app/lib/spotify';

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
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [filteredGenres, setFilteredGenres] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const tagBg = useColorModeValue('gray.100', 'gray.700');
  const aiTagBg = useColorModeValue('purple.100', 'purple.800');
  const tagTextColor = useColorModeValue('gray.800', 'white');

  // Load available genres on component mount
  useEffect(() => {
    const fetchGenres = async () => {
      setIsLoading(true);
      try {
        // Try to get genres from localStorage first
        const cachedGenres = localStorage.getItem('spotifyAvailableGenres');
        
        if (cachedGenres) {
          setAvailableGenres(JSON.parse(cachedGenres));
        } else {
          const genres = await getAvailableGenres();
          setAvailableGenres(genres);
          // Cache the genres in localStorage
          localStorage.setItem('spotifyAvailableGenres', JSON.stringify(genres));
        }
      } catch (error) {
        console.error('Error fetching available genres:', error);
        // Fallback to some common genres
        setAvailableGenres([
          'rock', 'pop', 'electronic', 'classical', 'jazz', 'hip-hop', 
          'indie', 'ambient', 'folk', 'metal', 'r&b', 'soul', 'blues'
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenres();
  }, []);

  // Filter genres based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredGenres([]);
      return;
    }

    const filtered = availableGenres
      .filter(genre => 
        genre.toLowerCase().includes(inputValue.toLowerCase()) && 
        !selectedGenres.includes(genre)
      )
      .slice(0, 10); // Limit to 10 suggestions
    
    setFilteredGenres(filtered);
  }, [inputValue, availableGenres, selectedGenres]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleAddGenre = (genre: string) => {
    if (selectedGenres.length >= maxGenres) {
      return; // Don't add more than maxGenres
    }
    
    if (!selectedGenres.includes(genre)) {
      const newGenres = [...selectedGenres, genre];
      onChange(newGenres);
    }
    
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    const newGenres = selectedGenres.filter(genre => genre !== genreToRemove);
    onChange(newGenres);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      
      // Check if the input matches any available genre
      const matchedGenre = availableGenres.find(
        genre => genre.toLowerCase() === inputValue.toLowerCase()
      );
      
      if (matchedGenre) {
        handleAddGenre(matchedGenre);
      } else if (filteredGenres.length > 0) {
        // Add the first suggestion if no exact match
        handleAddGenre(filteredGenres[0]);
      } else if (inputValue.trim().length > 2) {
        // Allow custom genre if at least 3 characters
        handleAddGenre(inputValue.trim().toLowerCase());
      }
    } else if (e.key === 'Backspace' && inputValue === '' && selectedGenres.length > 0) {
      // Remove the last genre when backspace is pressed on empty input
      handleRemoveGenre(selectedGenres[selectedGenres.length - 1]);
    }
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
      
      {/* Genre Input */}
      {selectedGenres.length < maxGenres && (
        <Box position="relative">
          <InputGroup>
            <Input
              ref={inputRef}
              placeholder={`Add a genre (${selectedGenres.length}/${maxGenres})...`}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              borderRadius="md"
              bg={bgColor}
              borderColor={borderColor}
            />
            <InputRightElement>
              {isLoading ? (
                <Spinner size="sm" color="blue.500" />
              ) : (
                <AddIcon color="gray.500" />
              )}
            </InputRightElement>
          </InputGroup>
          
          {/* Genre Suggestions */}
          {showSuggestions && filteredGenres.length > 0 && (
            <List
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={2}
              maxH="200px"
              overflowY="auto"
              bg={bgColor}
              borderRadius="md"
              boxShadow="lg"
              zIndex={10}
              border="1px solid"
              borderColor={borderColor}
            >
              {filteredGenres.map(genre => (
                <ListItem
                  key={genre}
                  p={2}
                  cursor="pointer"
                  _hover={{ bg: hoverBgColor }}
                  onClick={() => handleAddGenre(genre)}
                >
                  <Text>{genre}</Text>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}
      
      {/* Helper Text */}
      <Text fontSize="sm" color="gray.500" mt={2}>
        {selectedGenres.length === 0 
          ? 'Add up to 5 genres to customize your playlist' 
          : selectedGenres.length >= maxGenres 
            ? 'Maximum number of genres reached' 
            : `${maxGenres - selectedGenres.length} more genres can be added`}
      </Text>
    </Box>
  );
};

export default GenreSelector; 