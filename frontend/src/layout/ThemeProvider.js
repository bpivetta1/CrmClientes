import React, { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import theme from './theme';
import ColorModeContext from './themeContext';

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      calculatedLogoLight: () => {
        return process.env.REACT_APP_LOGO_URL || '/logo.png';
      },
      calculatedLogoDark: () => {
        return process.env.REACT_APP_LOGO_BRANCO_URL || '/logo-branco.png';
      },
      appLogoFavicon: process.env.REACT_APP_FAVICON_URL || '/favicon.ico',
      appName: process.env.REACT_APP_NAME || 'WORKZAP',
    }),
    [mode]
  );

  const themeWithMode = useMemo(() => theme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={themeWithMode}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}; 