// SPDX-License-Identifier: GPL-3.0-or-later
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './i18n.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<LanguageProvider><App /></LanguageProvider>);
