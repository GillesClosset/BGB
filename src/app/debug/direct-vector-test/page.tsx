'use client';

import { useState } from 'react';
import { 
  Box, Heading, Text, Textarea, Button, Container, 
  VStack, Divider, Code, Spinner, Alert, AlertIcon
} from '@chakra-ui/react';

export default function DirectVectorTestPage() {
  const [text, setText] = useState('Board game with strategy and resource management');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runTest() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/direct-vector-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxW="container.lg" p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Direct Vector Search Test</Heading>
          <Text mt={2} color="gray.600">
            This page tests multiple ways to call the vector search API to find the root cause of 401 errors.
          </Text>
        </Box>

        <Box>
          <Text fontWeight="bold" mb={2}>Test text:</Text>
          <Textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to search similar vectors for"
            rows={4}
          />
        </Box>

        <Button 
          colorScheme="blue" 
          onClick={runTest} 
          isLoading={loading}
          loadingText="Running test"
          isDisabled={!text.trim()}
        >
          Run Vector Search Test
        </Button>

        {loading && <Spinner />}

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {results && (
          <VStack spacing={4} align="stretch">
            <Divider />
            
            <Box>
              <Heading as="h3" size="md">Environment</Heading>
              <pre>{JSON.stringify(results.environment, null, 2)}</pre>
            </Box>
            
            <Box>
              <Heading as="h3" size="md">Request</Heading>
              <pre>{JSON.stringify(results.request, null, 2)}</pre>
            </Box>
            
            <Box>
              <Heading as="h3" size="md">Test Results</Heading>
              
              <Box p={4} borderWidth={1} borderRadius="md" mb={4}>
                <Heading as="h4" size="sm" mb={2}>Method 1: Relative URL with Auth Header</Heading>
                <Code display="block" whiteSpace="pre" overflowX="auto" p={2}>
                  {JSON.stringify(results.response.method1, null, 2)}
                </Code>
              </Box>
              
              <Box p={4} borderWidth={1} borderRadius="md" mb={4}>
                <Heading as="h4" size="sm" mb={2}>Method 2: Absolute URL with Auth Header</Heading>
                <Code display="block" whiteSpace="pre" overflowX="auto" p={2}>
                  {JSON.stringify(results.response.method2, null, 2)}
                </Code>
              </Box>
              
              <Box p={4} borderWidth={1} borderRadius="md">
                <Heading as="h4" size="sm" mb={2}>Method 3: Using Fetch API</Heading>
                <Code display="block" whiteSpace="pre" overflowX="auto" p={2}>
                  {JSON.stringify(results.response.method3, null, 2)}
                </Code>
              </Box>
            </Box>
            
            {results.diagnostics?.httpTest && (
              <Box>
                <Heading as="h3" size="md">Additional Tests</Heading>
                <Box p={4} borderWidth={1} borderRadius="md">
                  <Heading as="h4" size="sm" mb={2}>HTTP vs HTTPS Test</Heading>
                  <Code display="block" whiteSpace="pre" overflowX="auto" p={2}>
                    {JSON.stringify(results.diagnostics.httpTest, null, 2)}
                  </Code>
                </Box>
              </Box>
            )}
          </VStack>
        )}
      </VStack>
    </Container>
  );
} 