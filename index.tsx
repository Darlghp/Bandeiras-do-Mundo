import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister().then(boolean => {
          console.log('ServiceWorker unregistered: ', boolean);
        });
      }
    });

    // Brute-force clear caches just to be safe
    if (window.caches) {
      caches.keys().then((names) => {
        for (let name of names) {
          caches.delete(name);
        }
      });
    }
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);