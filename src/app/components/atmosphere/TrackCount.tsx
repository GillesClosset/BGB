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
  Grid,
  GridItem,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import { InfoIcon, TimeIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

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
  const [isExpanded, setIsExpanded] = useState(false);
  
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
    onChange(boundedValue);
  };

  const handleToggleAutoCalculate = () => {
    const newIsAutoCalculated = !isAutoCalculated;
    setIsAutoCalculated(newIsAutoCalculated);
    
    // If switching to auto, update with calculated value
    if (newIsAutoCalculated) {
      onChange(calculatedCount);
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
    <Box p={3} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
      <Flex justify="space-between" align="center" mb={2}>
        <Heading size="md" mb={0} display="flex" alignItems="center">
          Playlist Length
          <Badge ml={2} colorScheme="blue" fontSize="sm">
            {isAutoCalculated 
              ? `${calculatedCount} tracks` 
              : `${value} tracks`}
          </Badge>
        </Heading>
        <IconButton
          icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          size="sm"
          variant="ghost"
          aria-label={isExpanded ? "Collapse settings" : "Expand settings"}
          onClick={() => setIsExpanded(!isExpanded)}
        />
      </Flex>
      
      {/* Compact View (Always Visible) */}
      {!isExpanded && (
        <Grid templateColumns="1fr auto" gap={3} alignItems="center">
          <GridItem>
            <Flex align="center">
              <Text fontSize="sm" mr={2}>
                {isAutoCalculated 
                  ? `Auto: ${formatPlayTime(plannedPlayTime)} playtime`
                  : 'Manual: '}
              </Text>
              {!isAutoCalculated && (
                <NumberInput
                  min={1}
                  max={100}
                  value={value}
                  onChange={handleManualChange}
                  size="xs"
                  maxW="80px"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              )}
            </Flex>
          </GridItem>
          <GridItem>
            <Switch 
              id="auto-calculate-compact" 
              isChecked={isAutoCalculated}
              onChange={handleToggleAutoCalculate}
              colorScheme="blue"
              size="sm"
            />
          </GridItem>
        </Grid>
      )}
      
      {/* Expanded Controls */}
      <Collapse in={isExpanded} animateOpacity>
        <Box pt={3}>
          {isAutoCalculated && (
            <Box mb={3}>
              <Flex justify="space-between" align="center" mb={1}>
                <Text fontSize="sm" fontWeight="medium">
                  Play time:
                </Text>
                <Badge colorScheme="blue" px={2} py={0.5} borderRadius="full">
                  {formatPlayTime(plannedPlayTime)}
                </Badge>
              </Flex>
              <Slider
                min={30}
                max={360}
                step={15}
                value={plannedPlayTime}
                onChange={handlePlannedPlayTimeChange}
                colorScheme="blue"
                size="sm"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb boxSize={4} boxShadow="md">
                  <TimeIcon fontSize="xs" color="blue.500" />
                </SliderThumb>
              </Slider>
              <Text fontSize="xs" color={textColor} mt={1}>
                {playingTime !== plannedPlayTime ? (
                  <>Game's suggested: <Text as="span" fontWeight="bold">{formatPlayTime(playingTime)}</Text></>
                ) : (
                  <>Using game's suggested play time</>
                )}
              </Text>
            </Box>
          )}

          <FormControl display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Flex align="center">
              <FormLabel htmlFor="auto-calculate" mb="0" fontSize="sm">
                Auto-calculate
              </FormLabel>
              <Tooltip 
                label="Automatically calculates tracks based on play time (1 track ≈ 3 minutes)" 
                placement="top"
                hasArrow
              >
                <InfoIcon boxSize={3} color="gray.500" />
              </Tooltip>
            </Flex>
            <Switch 
              id="auto-calculate" 
              isChecked={isAutoCalculated}
              onChange={handleToggleAutoCalculate}
              colorScheme="blue"
              size="sm"
            />
          </FormControl>
          
          {!isAutoCalculated && (
            <Flex align="center" justify="space-between" mb={2}>
              <Text fontSize="sm">Number of tracks:</Text>
              <NumberInput
                min={1}
                max={100}
                value={value}
                onChange={handleManualChange}
                size="sm"
                maxW="100px"
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Flex>
          )}
          
          {isAutoCalculated && (
            <Text fontSize="xs" color={textColor}>
              {calculatedCount} tracks for {formatPlayTime(plannedPlayTime)} (avg. track: 3 min)
            </Text>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default TrackCount; 