// SPDX-License-Identifier: GPL-3.0-or-later
import { defineConfig } from 'vite';

// Relative paths, so the built files work at https://<owner>.github.io/<repository>/ whatever the repository is called.
// Two pages: the list (index.html) and the report page (report/index.html, served at .../report/).
export default defineConfig({
  base: './',
  build: { rollupOptions: { input: { main: 'index.html', report: 'report/index.html' } } },
});
