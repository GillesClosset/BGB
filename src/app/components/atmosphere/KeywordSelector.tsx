'use client';

import React, { useState, useRef } from 'react';
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
  useColorModeValue,
  Heading,
  Badge,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

interface KeywordSelectorProps {
  selectedKeywords: string[];
  onChange: (keywords: string[]) => void;
  aiSuggestedKeywords?: string[];
  maxKeywords?: number;
}

const KeywordSelector: React.FC<KeywordSelectorProps> = ({
  selectedKeywords,
  onChange,
  aiSuggestedKeywords = [],
  maxKeywords = 5,
}) => {
  const [input, setInput] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const tagBg = useColorModeValue('gray.100', 'gray.700');
  const aiTagBg = useColorModeValue('purple.100', 'purple.800');
  const tagTextColor = useColorModeValue('gray.800', 'white');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleAddKeyword = (keyword: string) => {
    if (selectedKeywords.length >= maxKeywords) {
      return; // Don't add more than maxKeywords
    }
    
    if (!selectedKeywords.includes(keyword)) {
      const newKeywords = [...selectedKeywords, keyword];
      onChange(newKeywords);
    }
    
    setInput('');
    inputRef.current?.focus();
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    const newKeywords = selectedKeywords.filter(keyword => keyword !== keywordToRemove);
    onChange(newKeywords);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim() !== '') {
      e.preventDefault();
      handleAddKeyword(input.trim());
    } else if (e.key === 'Backspace' && input === '' && selectedKeywords.length > 0) {
      // Remove the last keyword when backspace is pressed on empty input
      handleRemoveKeyword(selectedKeywords[selectedKeywords.length - 1]);
    }
  };

  // Check if a keyword was AI suggested
  const isAiSuggested = (keyword: string) => {
    return aiSuggestedKeywords.includes(keyword);
  };

  return (
    <Box>
      <Heading size="md" mb={3}>Keywords</Heading>
      
      {/* Selected Keywords */}
      <Flex wrap="wrap" gap={2} mb={4}>
        {selectedKeywords.map(keyword => (
          <Tag 
            key={keyword} 
            size="lg" 
            borderRadius="full" 
            variant="solid" 
            bg={isAiSuggested(keyword) ? aiTagBg : tagBg}
            color={tagTextColor}
          >
            <TagLabel>{keyword}</TagLabel>
            <TagCloseButton onClick={() => handleRemoveKeyword(keyword)} />
            {isAiSuggested(keyword) && (
              <Badge ml={1} colorScheme="purple" fontSize="xs">AI</Badge>
            )}
          </Tag>
        ))}
      </Flex>
      
      {/* Keyword Input */}
      {selectedKeywords.length < maxKeywords && (
        <Box position="relative">
          <InputGroup>
            <Input
              ref={inputRef}
              placeholder={`Add a keyword (${selectedKeywords.length}/${maxKeywords})...`}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              borderRadius="md"
              bg={inputBg}
              borderColor={borderColor}
            />
            <InputRightElement>
              <AddIcon color="gray.500" />
            </InputRightElement>
          </InputGroup>
        </Box>
      )}
      
      {/* Helper Text */}
      <Text fontSize="sm" color="gray.500" mt={2}>
        {selectedKeywords.length === 0 
          ? 'Add up to 5 search keywords to customize your playlist' 
          : selectedKeywords.length >= maxKeywords 
            ? 'Maximum number of keywords reached' 
            : `${maxKeywords - selectedKeywords.length} more keywords can be added`}
      </Text>
    </Box>
  );
};

export default KeywordSelector; 