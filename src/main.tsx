import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/variables.css';
import './styles/themes.css';
import './styles/global.css';
import './styles/components.css';
import App from './App.tsx';
import { AppProvider } from './context/AppProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);
