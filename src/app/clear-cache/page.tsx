'use client';

import React, { useEffect } from 'react';
import { Button, Box, Heading, Text, VStack, UnorderedList, ListItem, useColorModeValue } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

export default function ClearCachePage() {
  const router = useRouter();
  const bgColor = useColorModeValue('gray.100', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    // Force favicon refresh by replacing favicon links dynamically
    const oldLink = document.querySelector("link[rel='icon']");
    if (oldLink) {
      oldLink.parentNode?.removeChild(oldLink);
    }
    
    // Add new favicon links with timestamp to bypass cache
    const timestamp = new Date().getTime();
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.href = `/favicon.png?v=${timestamp}`;
    newLink.type = 'image/png';
    document.head.appendChild(newLink);
    
    // Also add ICO version
    const icoLink = document.createElement('link');
    icoLink.rel = 'icon';
    icoLink.href = `/favicon.ico?v=${timestamp}`;
    icoLink.type = 'image/x-icon';
    document.head.appendChild(icoLink);
  }, []);

  return (
    <Box p={8} bg={bgColor} minH="100vh">
      <VStack spacing={8} maxW="800px" mx="auto">
        <Heading as="h1" size="xl">Clear Browser Cache For Favicon</Heading>
        
        <Box bg={cardBg} p={6} borderRadius="md" shadow="md" w="100%">
          <Heading as="h2" size="md" mb={4}>For Firefox Users</Heading>
          <Text mb={4}>If you're having trouble seeing the favicon in Firefox, try these steps:</Text>
          
          <UnorderedList spacing={2} pl={4}>
            <ListItem>Close and reopen Firefox</ListItem>
            <ListItem>Press Ctrl+Shift+Delete to open the Clear History dialog</ListItem>
            <ListItem>Select "Cache" and ensure other data types are unchecked</ListItem>
            <ListItem>Set the time range to "Everything"</ListItem>
            <ListItem>Click "Clear Now"</ListItem>
            <ListItem>Hard refresh this page with Ctrl+F5</ListItem>
          </UnorderedList>
        </Box>

        <Box bg={cardBg} p={6} borderRadius="md" shadow="md" w="100%">
          <Heading as="h2" size="md" mb={4}>Other Browsers</Heading>
          <Text mb={4}>For Chrome, Edge, or Brave, try:</Text>
          
          <UnorderedList spacing={2} pl={4}>
            <ListItem>Hard refresh with Ctrl+F5 or Cmd+Shift+R</ListItem>
            <ListItem>Clear browser cache through settings</ListItem>
            <ListItem>Try opening the site in a private/incognito window</ListItem>
          </UnorderedList>
        </Box>
        
        <Button 
          colorScheme="green" 
          onClick={() => router.push('/')}
          size="lg"
        >
          Return to Home Page
        </Button>
      </VStack>
    </Box>
  );
} 