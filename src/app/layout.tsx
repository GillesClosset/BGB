import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import AppLayout from '@/app/components/layout/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BoardGame Beats - Generate Spotify Playlists for Board Games',
  description: 'Create the perfect soundtrack for your board game sessions with AI-powered music recommendations.',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/images/favicon-16x16_black.png', type: 'image/png', sizes: '16x16' },
      { url: '/images/favicon-32x32_black.png', type: 'image/png', sizes: '32x32' }
    ],
    shortcut: [
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }
    ],
    other: [
      {
        url: '/favicon.ico',
        rel: 'icon',
        type: 'image/x-icon',
      }
    ]
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Standard favicon */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        
        {/* Firefox-specific favicons - Firefox prefers PNG format */}
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/images/favicon-16x16_black.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/images/favicon-32x32_black.png" type="image/png" sizes="32x32" />
        
        {/* Firefox bookmark icon - Firefox prioritizes this for bookmarks */}
        <link rel="bookmark icon" href="/images/MrBeats_icon_round_small.png" type="image/png" />
        <link rel="icon" href="/images/MrBeats_icon_round_small.png" type="image/png" sizes="48x48" />
        
        {/* Explicitly adding type and sizes can help Firefox */}
        <meta name="msapplication-TileImage" content="/favicon.ico" />
        <meta name="msapplication-TileColor" content="#1DB954" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png" />
        
        {/* Special meta tag to force favicon refresh in Firefox */}
        <meta httpEquiv="cache-control" content="no-cache, must-revalidate, post-check=0, pre-check=0" />
        <meta httpEquiv="cache-control" content="max-age=0" />
        <meta httpEquiv="expires" content="0" />
        <meta httpEquiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
        <meta httpEquiv="pragma" content="no-cache" />
      </head>
      <body className={inter.className}>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
