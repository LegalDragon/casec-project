import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Load config.json before rendering the app
async function loadConfig() {
  try {
    const response = await fetch('/config.json?' + Date.now());
    window.APP_CONFIG = await response.json();
    if (window.APP_CONFIG.APP_TITLE) {
      document.title = window.APP_CONFIG.APP_TITLE;
    }
  } catch (err) {
    console.warn('Could not load config.json, using defaults:', err);
    window.APP_CONFIG = {};
  }
}

// Initialize the app
async function init() {
  await loadConfig();

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

init();

// Service worker is automatically registered by VitePWA plugin
