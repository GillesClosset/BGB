'use client';

import React from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Icon,
  useColorModeValue,
  HStack,
  Image,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FaSpotify, FaUser, FaSignOutAlt } from 'react-icons/fa';

export default function NavHeader() {
  const { data: session } = useSession();
  const router = useRouter();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      zIndex="10"
      bg={bgColor}
      boxShadow="sm"
      borderBottomWidth="1px"
      borderColor={borderColor}
    >
      <Flex
        h="60px"
        alignItems="center"
        justifyContent="space-between"
        maxW="container.xl"
        mx="auto"
        px={4}
      >
        {/* Logo/Home Link */}
        <HStack spacing={3} cursor="pointer" onClick={() => router.push('/')}>
          <Image 
            src="/images/MrBeats_icon_round_small.png" 
            alt="Mr Beats Icon" 
            boxSize="30px"
          />
          <Text fontWeight="bold" fontSize="xl">BoardGame Beats</Text>
        </HStack>

        {/* User Menu */}
        {session?.user ? (
          <Menu>
            <MenuButton
              as={Button}
              rounded={'full'}
              variant={'link'}
              cursor={'pointer'}
              minW={0}
            >
              <Avatar
                size={'sm'}
                src={session.user.image || undefined}
                name={session.user.name || 'User'}
              />
            </MenuButton>
            <MenuList>
              <MenuItem icon={<Icon as={FaUser} />} onClick={() => router.push('/profile')}>
                Profile
              </MenuItem>
              <MenuItem 
                icon={<Icon as={FaSignOutAlt} />} 
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign Out
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Button
            leftIcon={<Icon as={FaSpotify} />}
            colorScheme="green"
            onClick={() => router.push('/')}
            size="sm"
            bgColor="#1DB954"
            _hover={{ bgColor: "#1ED760" }}
          >
            Connect with Spotify
          </Button>
        )}
      </Flex>
    </Box>
  );
} 