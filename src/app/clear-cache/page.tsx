'use client';

import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  List,
  ListItem,
  ListIcon,
  OrderedList,
  UnorderedList,
  Code,
  Link,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

export default function ClearCachePage() {
  const router = useRouter();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  
  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">
            Firefox Favicon Fix
          </Heading>
          
          <Box 
            p={6} 
            bg={cardBg} 
            borderRadius="lg" 
            borderWidth="1px" 
            borderColor="gray.200"
            shadow="md"
          >
            <Heading as="h2" size="md" mb={4}>
              How to fix missing favicons in Firefox
            </Heading>
            
            <Text mb={4}>
              Firefox can sometimes be stubborn about caching favicons. If you're not seeing our favicon in Firefox, here are some steps to fix it:
            </Text>
            
            <OrderedList spacing={3} ml={5}>
              <ListItem>
                <Text fontWeight="bold">Clear Firefox's favicon cache:</Text>
                <UnorderedList>
                  <ListItem>Type <Code>about:support</Code> in your address bar</ListItem>
                  <ListItem>Click "Clear Startup Cache..." button</ListItem>
                  <ListItem>Click "Restart" when prompted</ListItem>
                </UnorderedList>
              </ListItem>
              
              <ListItem>
                <Text fontWeight="bold">Clear Firefox's regular cache:</Text>
                <UnorderedList>
                  <ListItem>Press <Code>Ctrl+Shift+Delete</Code> (or <Code>Cmd+Shift+Delete</Code> on macOS)</ListItem>
                  <ListItem>Make sure "Cache" is checked</ListItem>
                  <ListItem>Set "Time range" to "Everything"</ListItem>
                  <ListItem>Click "Clear Now"</ListItem>
                </UnorderedList>
              </ListItem>
              
              <ListItem>
                <Text fontWeight="bold">Refresh the page:</Text>
                <UnorderedList>
                  <ListItem>Press <Code>Ctrl+F5</Code> or <Code>Cmd+Shift+R</Code> to force a full refresh</ListItem>
                </UnorderedList>
              </ListItem>
            </OrderedList>
          </Box>
          
          <Button colorScheme="purple" size="lg" onClick={() => router.push('/')}>
            Return to Home Page
          </Button>
        </VStack>
      </Container>
    </Box>
  );
} 