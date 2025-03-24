'use client';

import { useState, useEffect } from 'react';
import { Box, Heading, Text, List, ListItem, Code, Divider, Button, Spinner, Alert, AlertIcon, Container, VStack, HStack, Badge } from '@chakra-ui/react';

export default function VectorSearchDebugPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runDiagnostics() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/vector-search');
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      console.error('Diagnostic error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runDiagnostics();
  }, []);

  function renderStatus(status: string) {
    if (status.startsWith('✓')) {
      return <Badge colorScheme="green">{status}</Badge>;
    } else if (status.startsWith('❌')) {
      return <Badge colorScheme="red">{status}</Badge>;
    }
    return <Badge>{status}</Badge>;
  }

  function renderObject(obj: any) {
    if (!obj || typeof obj !== 'object') return <Text>No data</Text>;
    
    return (
      <List spacing={2}>
        {Object.entries(obj).map(([key, value]) => (
          <ListItem key={key}>
            <HStack alignItems="flex-start">
              <Text fontWeight="bold" minWidth="120px">{key}:</Text>
              <Box>
                {typeof value === 'object' && value !== null ? (
                  JSON.stringify(value).length > 100 ? (
                    <details>
                      <summary>Expand</summary>
                      <pre>{JSON.stringify(value, null, 2)}</pre>
                    </details>
                  ) : (
                    <pre>{JSON.stringify(value, null, 2)}</pre>
                  )
                ) : (
                  <Text>{String(value)}</Text>
                )}
              </Box>
            </HStack>
          </ListItem>
        ))}
      </List>
    );
  }

  return (
    <Container maxW="container.lg" p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h1" size="xl">Vector Search Diagnostics</Heading>
          <Text mt={2} color="gray.600">
            This page tests each component of the vector search functionality to help troubleshoot issues.
          </Text>
        </Box>

        <HStack>
          <Button 
            colorScheme="blue" 
            onClick={runDiagnostics} 
            isLoading={loading}
            loadingText="Running diagnostics"
          >
            Run Diagnostics
          </Button>
          
          {loading && <Spinner color="blue.500" />}
        </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {results && (
          <VStack spacing={6} align="stretch">
            {results.errors && results.errors.length > 0 && (
              <Box borderWidth={1} borderColor="red.200" borderRadius="md" p={4} bg="red.50">
                <Heading as="h3" size="md" mb={2} color="red.600">Errors Detected</Heading>
                <List spacing={2} styleType="disc" pl={4}>
                  {results.errors.map((err: string, idx: number) => (
                    <ListItem key={idx} color="red.600">{err}</ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Box borderWidth={1} borderRadius="md" p={4}>
              <Heading as="h3" size="md" mb={4}>1. Environment Variables</Heading>
              {renderObject(results.environment)}
            </Box>

            <Box borderWidth={1} borderRadius="md" p={4}>
              <Heading as="h3" size="md" mb={4}>2. Supabase Connection</Heading>
              {renderObject(results.supabase)}
            </Box>

            <Box borderWidth={1} borderRadius="md" p={4}>
              <Heading as="h3" size="md" mb={4}>3. Embeddings Generation</Heading>
              {renderObject(results.embeddings)}
            </Box>

            <Box borderWidth={1} borderRadius="md" p={4}>
              <Heading as="h3" size="md" mb={4}>4. Vector Search Test</Heading>
              {renderObject(results.vectorSearch)}
            </Box>

            <Box borderWidth={1} borderRadius="md" p={4}>
              <Heading as="h3" size="md" mb={4}>5. API Endpoint Test</Heading>
              {renderObject(results.apiTest)}
            </Box>
          </VStack>
        )}
      </VStack>
    </Container>
  );
} 