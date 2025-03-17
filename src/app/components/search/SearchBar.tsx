'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Input,
  InputGroup,
  InputRightElement,
  Box,
  List,
  ListItem,
  Text,
  Spinner,
  useColorModeValue,
  Flex,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { searchBoardGames } from '@/app/lib/boardgames';
import { SearchResult } from '@/app/types/index';

interface SearchBarProps {
  onSelectGame: (game: SearchResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectGame }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const storedSearches = localStorage.getItem('recentBoardGameSearches');
    if (storedSearches) {
      try {
        setRecentSearches(JSON.parse(storedSearches).slice(0, 5));
      } catch (e) {
        console.error('Failed to parse recent searches from localStorage', e);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (game: SearchResult) => {
    const updatedSearches = [
      game,
      ...recentSearches.filter(item => item.id !== game.id)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentBoardGameSearches', JSON.stringify(updatedSearches));
  };

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSuggestions(true);

    try {
      const searchResults = await searchBoardGames(searchQuery);
      setResults(searchResults.map(game => ({
        id: game.id,
        name: game.name,
        yearPublished: parseInt(game.yearPublished) || 0,
        image: '' // Image will be populated when game details are fetched
      })));
    } catch (err) {
      setError('Failed to search for games. Please try again.');
      toast({
        title: 'Search Error',
        description: 'Failed to search for games. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for search
    searchTimeout.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  const handleSelectGame = (game: SearchResult) => {
    onSelectGame(game);
    saveRecentSearch(game);
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setShowSuggestions(false);
  };

  return (
    <Box position="relative" width="100%" maxW="600px" mx="auto">
      <InputGroup>
        <Input
          placeholder="Search for board games..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 3 && setShowSuggestions(true)}
          borderRadius="md"
          size="lg"
          bg={bgColor}
          borderColor={borderColor}
          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
        />
        <InputRightElement h="full">
          {isLoading ? (
            <Spinner size="sm" color="blue.500" mr={2} />
          ) : query ? (
            <IconButton
              aria-label="Clear search"
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              onClick={handleClearSearch}
            />
          ) : (
            <SearchIcon color="gray.500" mr={2} />
          )}
        </InputRightElement>
      </InputGroup>

      {showSuggestions && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={2}
          maxH="300px"
          overflowY="auto"
          bg={bgColor}
          borderRadius="md"
          boxShadow="lg"
          zIndex={10}
          border="1px solid"
          borderColor={borderColor}
        >
          {error ? (
            <Text p={4} color="red.500">
              {error}
            </Text>
          ) : results.length > 0 ? (
            <List spacing={0}>
              {results.map(game => (
                <ListItem
                  key={game.id}
                  p={3}
                  cursor="pointer"
                  _hover={{ bg: hoverBgColor }}
                  onClick={() => handleSelectGame(game)}
                >
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="medium">{game.name}</Text>
                    {game.yearPublished > 0 && (
                      <Text fontSize="sm" color="gray.500">
                        {game.yearPublished}
                      </Text>
                    )}
                  </Flex>
                </ListItem>
              ))}
            </List>
          ) : query.length >= 3 && !isLoading ? (
            <Text p={4} color="gray.500">
              No results found
            </Text>
          ) : query.length < 3 && recentSearches.length > 0 ? (
            <Box>
              <Text p={2} fontSize="sm" fontWeight="bold" color="gray.500">
                Recent Searches
              </Text>
              <List spacing={0}>
                {recentSearches.map(game => (
                  <ListItem
                    key={game.id}
                    p={3}
                    cursor="pointer"
                    _hover={{ bg: hoverBgColor }}
                    onClick={() => handleSelectGame(game)}
                  >
                    <Flex justify="space-between" align="center">
                      <Text>{game.name}</Text>
                      {game.yearPublished > 0 && (
                        <Text fontSize="sm" color="gray.500">
                          {game.yearPublished}
                        </Text>
                      )}
                    </Flex>
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );
};

export default SearchBar; 