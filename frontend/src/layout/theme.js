import { createTheme } from '@material-ui/core/styles';

const theme = (mode) => createTheme({
  mode: mode,
  palette: {
    type: mode,
    light: '#ebf2ff',
    dark: '#11111e',
    primary: {
      main: mode === 'light' ? '#245798' : '#1d4e85',
    },
    secondary: {
      main: mode === 'light' ? '#096799' : '#075781',
    },
    background: {
      default: mode === 'light' ? '#ebf2ff' : '#11111e',
      paper: mode === 'light' ? '#fff' : '#1d2433',
    },
    text: {
      primary: mode === 'light' ? '#000' : '#fff',
      secondary: mode === 'light' ? '#8c8a8a' : '#ccc',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: mode === 'light' ? '#bebebe' : '#353535',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: mode === 'light' ? '#f5f5f5' : '#202020',
        },
      },
    },
  },
});

export default theme; 