// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tailwind.css';
import { HelmetProvider } from 'react-helmet-async';
import { SeoProvider } from './context/SeoContext';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <SeoProvider>
        <App />
      </SeoProvider>
    </HelmetProvider>
  </React.StrictMode>
);
