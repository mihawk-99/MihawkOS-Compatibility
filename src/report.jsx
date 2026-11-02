// SPDX-License-Identifier: GPL-3.0-or-later
import { createRoot } from 'react-dom/client';
import { LanguageProvider, loadLanguage, storedLanguage } from './i18n.jsx';
import ReportPage from './ReportPage.jsx';

loadLanguage(storedLanguage()).then(() => {
  createRoot(document.getElementById('root')).render(<LanguageProvider><ReportPage /></LanguageProvider>);
});
