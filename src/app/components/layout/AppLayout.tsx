'use client';

import React from 'react';
import { Box } from '@chakra-ui/react';
import NavHeader from './NavHeader';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show the header on the landing page
  const isLandingPage = pathname === '/';
  
  return (
    <Box minH="100vh">
      {!isLandingPage && <NavHeader />}
      {children}
    </Box>
  );
} 