'use client';

import React, { useState } from 'react';
import {
  SimpleGrid,
  Box,
  Image,
  Text,
  Heading,
  Flex,
  Button,
  Spinner,
  Center,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { SearchResult } from '@/app/types/index';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  onSelectGame: (game: SearchResult) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  onSelectGame,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  const totalPages = Math.ceil(results.length / resultsPerPage);

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const yearColor = useColorModeValue('gray.600', 'gray.400');

  // Calculate pagination
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Placeholder image for games without images
  const placeholderImage = 'https://via.placeholder.com/200x200?text=No+Image';

  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Center>
    );
  }

  if (results.length === 0) {
    return (
      <Center py={10}>
        <Box textAlign="center">
          <Heading size="md" mb={4}>No Results Found</Heading>
          <Text color={yearColor}>
            Try adjusting your search terms or browse popular games instead.
          </Text>
        </Box>
      </Center>
    );
  }

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={6} my={6}>
        {currentResults.map((game) => (
          <Box
            key={game.id}
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg={cardBg}
            borderColor={cardBorder}
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-5px)', shadow: 'md' }}
            onClick={() => onSelectGame(game)}
            cursor="pointer"
            height="100%"
            display="flex"
            flexDirection="column"
          >
            <Image
              src={game.image || placeholderImage}
              alt={game.name}
              height="200px"
              width="100%"
              objectFit="cover"
              fallbackSrc={placeholderImage}
              loading="lazy"
            />
            <Box p={4} flex="1" display="flex" flexDirection="column">
              <Heading size="sm" mb={2} noOfLines={2} color={textColor}>
                {game.name}
              </Heading>
              {game.yearPublished > 0 && (
                <Badge colorScheme="blue" alignSelf="flex-start">
                  {game.yearPublished}
                </Badge>
              )}
            </Box>
          </Box>
        ))}
      </SimpleGrid>

      {totalPages > 1 && (
        <Flex justify="center" mt={8} mb={4}>
          <Button
            leftIcon={<ChevronLeftIcon />}
            onClick={() => handlePageChange(currentPage - 1)}
            isDisabled={currentPage === 1}
            mr={2}
            size="sm"
          >
            Previous
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              size="sm"
              variant={page === currentPage ? 'solid' : 'outline'}
              colorScheme={page === currentPage ? 'blue' : 'gray'}
              onClick={() => handlePageChange(page)}
              mx={1}
            >
              {page}
            </Button>
          ))}
          
          <Button
            rightIcon={<ChevronRightIcon />}
            onClick={() => handlePageChange(currentPage + 1)}
            isDisabled={currentPage === totalPages}
            ml={2}
            size="sm"
          >
            Next
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default SearchResults; 