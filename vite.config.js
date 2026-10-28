// SPDX-License-Identifier: GPL-3.0-or-later
import { defineConfig } from 'vite';

// Relative paths, so the built files work at https://<owner>.github.io/<repository>/ whatever the repository is called.
export default defineConfig({ base: './' });
