'use client';

import { useState, useEffect } from 'react';
import { Box, Heading, Container, VStack, Code, Button, Spinner, Text } from '@chakra-ui/react';

export default function DatabaseCheckPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/direct-vector-test');
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Error fetching database info:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Container maxW="container.lg" p={6}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl">Database Structure Check</Heading>
        
        <Button 
          colorScheme="blue" 
          onClick={fetchData} 
          isLoading={loading}
          mt={4}
          size="sm"
        >
          Refresh Data
        </Button>
        
        {loading && (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Checking database structure...</Text>
          </Box>
        )}
        
        {error && (
          <Box p={4} bg="red.50" borderRadius="md">
            <Heading as="h3" size="md" color="red.500" mb={2}>Error</Heading>
            <Text color="red.500">{error}</Text>
          </Box>
        )}
        
        {data && !loading && (
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading as="h2" size="md" mb={2}>Tables</Heading>
              <Code p={4} borderRadius="md" display="block" whiteSpace="pre" overflowX="auto">
                {JSON.stringify(data.tables, null, 2)}
              </Code>
            </Box>
            
            <Box>
              <Heading as="h2" size="md" mb={2}>Functions</Heading>
              <Code p={4} borderRadius="md" display="block" whiteSpace="pre" overflowX="auto">
                {JSON.stringify(data.functions, null, 2)}
              </Code>
            </Box>
          </VStack>
        )}
      </VStack>
    </Container>
  );
} 