import '@fontsource-variable/tektur/index.css';
import '@fontsource/vt323/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing root element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
