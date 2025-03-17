'use client';

import React, { useState } from 'react';
import {
  Button,
  Box,
  Text,
  useColorModeValue,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { FaBrain } from 'react-icons/fa';
import { generateMusicRecommendations } from '@/app/lib/ai';
import { BoardGame } from '@/app/types';

interface AiSuggestionButtonProps {
  game: BoardGame | null;
  onSuggestionsGenerated: (genres: string[], keywords: string[], explanation?: string) => void;
  isDisabled?: boolean;
}

const AiSuggestionButton: React.FC<AiSuggestionButtonProps> = ({
  game,
  onSuggestionsGenerated,
  isDisabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  const buttonBg = useColorModeValue('purple.500', 'purple.300');
  const buttonHoverBg = useColorModeValue('purple.600', 'purple.400');

  const handleGenerateSuggestions = async () => {
    if (!game) {
      toast({
        title: 'No game selected',
        description: 'Please select a board game first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a simple atmosphere settings object for the AI
      const atmosphereSettings = {
        tempo: 50,
        energy: 50,
        complexity: 50,
        mood: 'neutral',
        genres: [],
        era: 'modern',
      };

      // Call the AI service
      const aiResponse = await generateMusicRecommendations(game, atmosphereSettings);

      // Check if we got a valid response
      if (!aiResponse.genres || aiResponse.genres.length === 0) {
        setError('AI service returned an empty response. Using default suggestions.');
      }

      // Log both genres and keywords to console for debugging
      console.log('AI suggested genres:', aiResponse.genres || []);
      console.log('AI suggested keywords:', aiResponse.keywords || []);
      
      // Pass the suggestions to the parent component
      onSuggestionsGenerated(
        aiResponse.genres || [],
        aiResponse.keywords || [],
        aiResponse.explanation || "Generated based on the board game's theme and mechanics."
      );

      if (!error) {
        toast({
          title: 'AI Suggestions Generated',
          description: 'Music genre and keyword recommendations have been generated for your game.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error generating AI suggestions:', err);
      setError('Failed to generate AI suggestions.');
      
      toast({
        title: 'Error',
        description: 'Failed to generate AI suggestions. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      p={6} 
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      bg={useColorModeValue('white', 'gray.800')}
      shadow="md"
    >
      <Button
        onClick={handleGenerateSuggestions}
        isLoading={isLoading}
        loadingText="Generating suggestions..."
        isDisabled={isDisabled || isLoading || !game}
        colorScheme="purple"
        size="lg"
        width="full"
        leftIcon={<FaBrain />}
        _hover={{
          bg: buttonHoverBg
        }}
      >
        Get AI Suggestions
      </Button>
      
      {isLoading && (
        <Box textAlign="center" mt={4}>
          <Spinner size="sm" mr={2} />
          <Text display="inline">
            Analyzing {game?.name}&apos;s themes and mechanics...
          </Text>
        </Box>
      )}
      
      {error && (
        <Text color="red.500" mt={2}>
          {error}
        </Text>
      )}
    </Box>
  );
};

export default AiSuggestionButton; 