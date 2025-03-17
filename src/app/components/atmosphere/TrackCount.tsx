'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
  useColorModeValue,
  Heading,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { InfoIcon, TimeIcon } from '@chakra-ui/icons';

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
  const [isAutoCalculated, setIsAutoCalculated] = useState(true);
  const [calculatedCount, setCalculatedCount] = useState(10);
  const [plannedPlayTime, setPlannedPlayTime] = useState(playingTime);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const highlightColor = useColorModeValue('blue.500', 'blue.300');

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
    
    if (isAutoCalculated) {
      onChange(boundedCount);
    }
  }, [playingTime, plannedPlayTime, isAutoCalculated, onChange]);

  const handleManualChange = (valueAsString: string, valueAsNumber: number) => {
    // Ensure value is between 1 and 100
    const boundedValue = Math.min(Math.max(valueAsNumber || 1, 1), 100);
    console.log(`Manual track count changed to: ${boundedValue}`);
    onChange(boundedValue);
  };

  const handleToggleAutoCalculate = () => {
    const newIsAutoCalculated = !isAutoCalculated;
    console.log(`Auto-calculate toggled to: ${newIsAutoCalculated}`);
    setIsAutoCalculated(newIsAutoCalculated);
    
    // If switching to auto, update with calculated value
    if (newIsAutoCalculated) {
      console.log(`Switching to auto mode, using calculated count: ${calculatedCount}`);
      onChange(calculatedCount);
    } else {
      // When switching to manual mode, keep the current value as starting point
      console.log(`Switching to manual mode, keeping current value: ${value}`);
      // We don't need to call onChange here as the current value is already correct
    }
  };

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
    <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
      <Heading size="md" mb={4}>Playlist Length</Heading>
      
      <Flex direction="column" gap={4}>
        {isAutoCalculated && (
          <Box>
            <FormLabel htmlFor="planned-play-time" fontWeight="medium">
              How long do you plan to play?
            </FormLabel>
            <Flex direction="column" mb={4}>
              <HStack spacing={4} mb={2}>
                <Slider
                  id="planned-play-time"
                  min={30}
                  max={360}
                  step={15}
                  value={plannedPlayTime}
                  onChange={handlePlannedPlayTimeChange}
                  colorScheme="blue"
                  aria-label="Planned play time"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb boxSize={6} boxShadow="md">
                    <TimeIcon color="blue.500" />
                  </SliderThumb>
                </Slider>
                <Badge colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="full">
                  {formatPlayTime(plannedPlayTime)}
                </Badge>
              </HStack>
              <Text fontSize="sm" color={textColor}>
                {playingTime !== plannedPlayTime ? (
                  <>Game&apos;s suggested play time: <Text as="span" fontWeight="bold">{formatPlayTime(playingTime)}</Text></>
                ) : (
                  <>Using game&apos;s suggested play time</>
                )}
              </Text>
            </Flex>
          </Box>
        )}

        <FormControl display="flex" alignItems="center" justifyContent="space-between">
          <FormLabel htmlFor="auto-calculate" mb="0" display="flex" alignItems="center">
            Auto-calculate tracks based on play time
            <Tooltip 
              label="Automatically calculates the number of tracks based on your planned play time (1 track ≈ 3 minutes)" 
              placement="top"
              hasArrow
            >
              <InfoIcon ml={2} color="gray.500" />
            </Tooltip>
          </FormLabel>
          <Switch 
            id="auto-calculate" 
            isChecked={isAutoCalculated}
            onChange={handleToggleAutoCalculate}
            colorScheme="blue"
          />
        </FormControl>
        
        <Box>
          {isAutoCalculated ? (
            <Flex direction="column">
              <Text mb={2}>
                Estimated tracks: <Text as="span" fontWeight="bold" color={highlightColor}>{calculatedCount}</Text>
              </Text>
              <Text fontSize="sm" color={textColor}>
                Based on {formatPlayTime(plannedPlayTime)} of gameplay (avg. track length: 3 minutes)
              </Text>
            </Flex>
          ) : (
            <Flex direction="column">
              <FormLabel htmlFor="manual-track-count" fontWeight="medium">
                Number of tracks:
              </FormLabel>
              <NumberInput
                id="manual-track-count"
                min={1}
                max={100}
                value={value}
                onChange={handleManualChange}
                size="md"
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Flex>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default TrackCount; 