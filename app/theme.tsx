"use client";
import { createTheme } from "@mui/material/styles";
import { Fade } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6a6bef",
    },
    background: {
      default: "#f6f4fb",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid #E2E8F0",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: "#1E293B",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "capitalize",
        },
      },
    },
    MuiSnackbar: {
      defaultProps: {
        autoHideDuration: 4000,
        slots: { transition: (props) => <Fade {...props} /> },
      },
    },
  },
});
