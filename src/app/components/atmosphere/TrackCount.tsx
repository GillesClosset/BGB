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
          marks={[
            { value: 60, label: '1h' },
            { value: 120, label: '2h' },
            { value: 180, label: '3h' },
            { value: 240, label: '4h' },
            { value: 300, label: '5h' },
            { value: 360, label: '6h' },
          ]}
        >
          <SliderTrack height="4px">
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb boxSize={4} boxShadow="md">
            <TimeIcon fontSize="xs" color="blue.500" />
          </SliderThumb>
        </Slider>
        
        <Flex justify="space-between" fontSize="xs" color={textColor}>
          <Text>
            {playingTime !== plannedPlayTime ? (
              <>Game's suggested: <Text as="span" fontWeight="bold">{formatPlayTime(playingTime)}</Text></>
            ) : (
              <>Using game's suggested play time</>
            )}
          </Text>
          <Text>
            {calculatedCount} tracks (avg. 3 min per track)
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};

export default TrackCount; 