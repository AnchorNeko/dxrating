import { ThemeProvider, createTheme } from "@mui/material";
import "@unocss/reset/tailwind-compat.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "virtual:uno.css";
import { App } from "./App";
import "./index.css";

const theme = createTheme({
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "Torus, system-ui, Avenir, Helvetica, Arial, sans-serif",
  },
  palette: {
    primary: {
      main: "#855cb8",
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <Toaster
        toastOptions={{
          className: "!rounded-full font-bold pr-1 py-2",
          duration: 5e3,
          error: {
            duration: 10e3,
          },
        }}
      />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
