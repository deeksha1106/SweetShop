'use client';

import { Inter, Poppins, Playfair_Display } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

import { theme } from '@/theme/theme';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import { Box } from '@mui/material';

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-poppins' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-playfair' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  return (
    <html lang="en">
      <head>
        <title>Sweet Shop - Premium Sweets & Confectionery</title>
        <meta name="description" content="Discover premium sweets and confectionery at Sweet Shop. Browse our extensive collection of chocolates, candies, and gourmet treats." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} ${poppins.className} ${playfair.className}`}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
              <Box
                sx={{
                  minHeight: '100vh',
                  background: '#120c0a',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                      radial-gradient(circle at 25% 75%, rgba(139, 69, 19, 0.2) 0%, transparent 60%),
                      radial-gradient(circle at 75% 25%, rgba(210, 105, 30, 0.15) 0%, transparent 60%),
                      radial-gradient(circle at 50% 50%, rgba(205, 133, 63, 0.12) 0%, transparent 70%),
                      radial-gradient(circle at 10% 90%, rgba(32, 178, 170, 0.08) 0%, transparent 50%)
                    `,
                    pointerEvents: 'none',
                    zIndex: -1,
                  }
                }}
              >
                <Navbar />
                <main>
                  {children}
                </main>
              </Box>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1a1a2e',
                    color: '#fff',
                    border: '1px solid #333',
                  },
                  success: {
                    iconTheme: {
                      primary: '#4caf50',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#f44336',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
