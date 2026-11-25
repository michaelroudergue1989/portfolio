import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import '@/i18n';
import { initTheme } from '@/lib/theme';
import '@/styles/index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('No se encontró el elemento #root');
}

initTheme();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
