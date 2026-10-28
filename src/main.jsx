// SPDX-License-Identifier: GPL-3.0-or-later
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './app.css';

// Night by default; a choice made with the header's slider is remembered on this device only.
try {
  if (localStorage.getItem('theme') === 'light') document.documentElement.dataset.theme = 'light';
} catch { /* storage blocked: keep night */ }

createRoot(document.getElementById('root')).render(<App />);
