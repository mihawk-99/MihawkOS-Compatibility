// SPDX-License-Identifier: GPL-3.0-or-later
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './i18n.jsx';
import ReportPage from './ReportPage.jsx';

createRoot(document.getElementById('root')).render(<LanguageProvider><ReportPage /></LanguageProvider>);
