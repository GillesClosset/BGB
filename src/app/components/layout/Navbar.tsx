'use client';

import { 
  Box, 
  Flex, 
  Button, 
  useColorMode, 
  IconButton, 
  Heading, 
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  Text,
  Badge,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { FaSpotify } from 'react-icons/fa';
import { useEffect } from 'react';

export default function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { data: session, status } = useSession();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Check for authentication errors
  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      toast({
        title: 'Session Expired',
        description: 'Please sign in again to continue using Spotify features',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      
      // Sign out to clear the invalid session
      signOut({ redirect: false });
    }
  }, [session, toast]);
  
  const handleSignIn = async () => {
    try {
      await signIn('spotify', { callbackUrl: window.location.pathname });
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'Authentication Failed',
        description: 'There was an error signing in with Spotify',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Box 
      as="nav" 
      position="fixed" 
      w="100%" 
      zIndex={10}
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={4}
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={8} alignItems="center">
          <Link href="/" passHref>
            <Heading as="h1" size="md" cursor="pointer">
              BoardGame Beats
            </Heading>
          </Link>
          
          <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
            <Link href="/search" passHref>
              <Text fontWeight="medium" cursor="pointer">Search</Text>
            </Link>
            {session && (
              <Link href="/playlists" passHref>
                <Text fontWeight="medium" cursor="pointer">My Playlists</Text>
              </Link>
            )}
            <Link href="/spotify-test" passHref>
              <Text fontWeight="medium" cursor="pointer" position="relative">
                Spotify Test
                <Badge 
                  colorScheme="green" 
                  position="absolute" 
                  top="-8px" 
                  right="-8px" 
                  fontSize="0.6em"
                >
                  New
                </Badge>
              </Text>
            </Link>
            <Link href="/ai-test" passHref>
              <Text fontWeight="medium" cursor="pointer" position="relative">
                AI Test
                <Badge 
                  colorScheme="purple" 
                  position="absolute" 
                  top="-8px" 
                  right="-8px" 
                  fontSize="0.6em"
                >
                  New
                </Badge>
              </Text>
            </Link>
          </HStack>
        </HStack>
        
        <Flex alignItems="center">
          <IconButton
            mr={4}
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />
          
          {status === 'loading' ? (
            <Button isLoading variant="ghost" />
          ) : session ? (
            <Menu>
              <Tooltip label={session.user.name || 'Spotify User'}>
                <MenuButton
                  as={Button}
                  rounded="full"
                  variant="link"
                  cursor="pointer"
                  minW={0}
                >
                  <Avatar 
                    size="sm" 
                    src={session.user.image || undefined} 
                    name={session.user.name || 'User'} 
                  />
                </MenuButton>
              </Tooltip>
              <MenuList>
                <MenuItem as={Link} href="/profile">
                  Profile
                </MenuItem>
                <MenuItem as={Link} href="/playlists">
                  My Playlists
                </MenuItem>
                <MenuItem as={Link} href="/ai-test">
                  AI Test
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={() => signOut()}>
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Button 
              colorScheme="green" 
              onClick={handleSignIn}
              leftIcon={<FaSpotify />}
            >
              Sign in with Spotify
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
} 