import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8B4513',
      light: '#A0522D',
      dark: '#654321',
      contrastText: '#F5E6D3',
    },
    secondary: {
      main: '#D2691E',
      light: '#DEB887',
      dark: '#A0522D',
      contrastText: '#FFFFFF',
    },
    tertiary: {
      main: '#CD853F',
      light: '#F4A460',
      dark: '#8B7355',
      contrastText: '#2F1B14',
    },
    background: {
      default: '#2F1B14',
      paper: '#3C2415',
    },
    surface: {
      main: '#4A2C17',
      light: '#5D3317',
      dark: '#2F1B14',
    },
    text: {
      primary: '#F5E6D3',
      secondary: '#E6D3C1',
      tertiary: '#D2B48C',
      disabled: '#A0522D',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    warning: {
      main: '#DAA520',
      light: '#F4A460',
      dark: '#B8860B',
    },
    info: {
      main: '#20B2AA',
      light: '#48D1CC',
      dark: '#008B8B',
    },
    success: {
      main: '#8FBC8F',
      light: '#98FB98',
      dark: '#556B2F',
    },
    divider: 'rgba(245, 230, 211, 0.12)',
    accent: {
      cyan: '#20B2AA',
      rose: '#F4A460',
      violet: '#DDA0DD',
      emerald: '#8FBC8F',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      background: 'linear-gradient(135deg, #8B5CF6, #EC4899, #F59E0B)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.95rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7C3AED, #DB2777)',
            boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)',
          },
        },
        outlined: {
          borderColor: '#8B5CF6',
          color: '#8B5CF6',
          '&:hover': {
            borderColor: '#EC4899',
            color: '#EC4899',
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(26, 27, 46, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(15, 15, 26, 0.4)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 20px 60px rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'rgba(26, 27, 46, 0.95)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            backgroundColor: 'rgba(248, 250, 252, 0.03)',
            backdropFilter: 'blur(8px)',
            '& fieldset': {
              borderColor: 'rgba(139, 92, 246, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(139, 92, 246, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#8B5CF6',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(26, 27, 46, 0.95)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
          boxShadow: '0 8px 32px rgba(15, 15, 26, 0.4)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
          backdropFilter: 'blur(8px)',
        },
        filled: {
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
          color: '#F8FAFC',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        },
        outlined: {
          borderColor: 'rgba(139, 92, 246, 0.4)',
          color: '#8B5CF6',
          '&:hover': {
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(26, 27, 46, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(139, 92, 246, 0.12)',
          borderRadius: 16,
        },
      },
    },
  },
});


declare module '@mui/material/styles' {
  interface Palette {
    surface: {
      main: string;
      light: string;
      dark: string;
    };
    tertiary: {
      main: string;
      light: string;
      dark: string;
      contrastText: string;
    };
    accent: {
      cyan: string;
      rose: string;
      violet: string;
      emerald: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      disabled: string;
    };
  }

  interface PaletteOptions {
    surface?: {
      main: string;
      light?: string;
      dark?: string;
    };
    tertiary?: {
      main: string;
      light?: string;
      dark?: string;
      contrastText?: string;
    };
    accent?: {
      cyan?: string;
      rose?: string;
      violet?: string;
      emerald?: string;
    };
    text?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
      disabled?: string;
    };
  }
}
