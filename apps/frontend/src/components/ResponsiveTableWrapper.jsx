import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

export default function ResponsiveTableWrapper({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  if (isMobile) {
    return (
      <Box sx={{ 
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: 8,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'grey.100',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'grey.400',
          borderRadius: 4,
          '&:hover': {
            backgroundColor: 'grey.600',
          },
        },
      }}>
        {children}
      </Box>
    );
  }

  if (isTablet) {
    return (
      <Box sx={{ 
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: 6,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'grey.50',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'grey.300',
          borderRadius: 3,
        },
      }}>
        {children}
      </Box>
    );
  }

  return <Box>{children}</Box>;
}
