'use client'

import { createTheme } from '@mui/material'
import { POGO_MOVES_COLORS } from './colors'

const theme = createTheme({
  palette: {
    background: {
      default: POGO_MOVES_COLORS.background,
      paper: POGO_MOVES_COLORS.white,
    },
    primary: {
      main: POGO_MOVES_COLORS.primary,
    },
    secondary: {
      main: POGO_MOVES_COLORS.secondary,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'unset',
        },
      },
    },
  },
})

export default theme
