'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  Heading,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Badge,
} from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';

interface TrackCountProps {
  playingTime: number;
  value: number;
  onChange: (value: number) => void;
}

const TrackCount: React.FC<TrackCountProps> = ({
  playingTime,
  value,
  onChange,
}) => {
  const [calculatedCount, setCalculatedCount] = useState(10);
  const [plannedPlayTime, setPlannedPlayTime] = useState(playingTime);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  // Calculate track count based on playing time
  useEffect(() => {
    if (!playingTime) return;
    
    // Default to the game's playing time if planned play time is not set
    const timeToUse = plannedPlayTime || playingTime;
    
    // Formula: 1 track per 3 minutes of gameplay
    const avgTrackDuration = 3; // minutes
    const calculatedTracks = Math.round(timeToUse / avgTrackDuration);
    
    const boundedCount = Math.min(Math.max(calculatedTracks, 5), 100);
    setCalculatedCount(boundedCount);
    
    // Always update with calculated value
    onChange(boundedCount);
  }, [playingTime, plannedPlayTime, onChange]);

  const handlePlannedPlayTimeChange = (value: number) => {
    setPlannedPlayTime(value);
  };

  // Format time display (e.g., "2h 30m" for 150 minutes)
  const formatPlayTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <Box p={3} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
      <Flex justify="space-between" align="center" mb={3}>
        <Heading size="md" mb={0} display="flex" alignItems="center">
          How Long will you Play?
          <Badge ml={2} colorScheme="blue" fontSize="sm">
            {calculatedCount} tracks
          </Badge>
        </Heading>
        <Badge colorScheme="blue" px={2} py={0.5} borderRadius="full">
          {formatPlayTime(plannedPlayTime)}
        </Badge>
      </Flex>
      
      <Flex direction="column" gap={2}>
        <Slider
          min={30}
          max={360}
          step={15}
          value={plannedPlayTime}
          onChange={handlePlannedPlayTimeChange}
          colorScheme="blue"
          size="md"
        >
          <SliderMark value={60} mt={2} ml={-2.5} fontSize="xs">1h</SliderMark>
          <SliderMark value={120} mt={2} ml={-2.5} fontSize="xs">2h</SliderMark>
          <SliderMark value={180} mt={2} ml={-2.5} fontSize="xs">3h</SliderMark>
          <SliderMark value={240} mt={2} ml={-2.5} fontSize="xs">4h</SliderMark>
          <SliderMark value={300} mt={2} ml={-2.5} fontSize="xs">5h</SliderMark>
          <SliderMark value={360} mt={2} ml={-2.5} fontSize="xs">6h</SliderMark>
          <SliderTrack height="4px">
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb boxSize={4} boxShadow="md">
            <TimeIcon fontSize="xs" color="blue.500" />
          </SliderThumb>
        </Slider>
        
        <Flex justify="space-between" fontSize="sm" color={textColor} mt={6}>
          <Text>
            {playingTime !== plannedPlayTime ? (
              <>Game's suggested: <Text as="span" fontWeight="bold">{formatPlayTime(playingTime)}</Text></>
            ) : (
              <>Using game's suggested play time</>
            )}
          </Text>
          <Text>
            (avg. 3 min per track)
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};

export default TrackCount; 