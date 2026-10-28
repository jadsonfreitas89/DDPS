import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registra o Service Worker do PWA para funcionamento offline
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[DDPS PWA] Nova versão disponível.');
  },
  onOfflineReady() {
    console.log('[DDPS PWA] Aplicativo pronto para uso offline.');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
