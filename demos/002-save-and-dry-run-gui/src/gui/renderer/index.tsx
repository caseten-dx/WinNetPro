// React entry point. Mounts <App /> into #root. The IPC bridge (window.api)
// is set up by preload.ts before this script runs.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
