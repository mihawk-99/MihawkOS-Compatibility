// SPDX-License-Identifier: GPL-3.0-or-later
// data/versions.json: MihawkOS's releases, newest first, the version list the report page opens with (it then asks
// GitHub itself) and the list's filters. When GitHub does not answer, the file is kept.
//
//   [GITHUB_TOKEN=...] node scripts/fetch-versions.mjs
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { RELEASES_URL, releaseVersions } from '../src/fields.js';

export { releaseVersions };

async function main() {
  const file = fileURLToPath(new URL('../data/versions.json', import.meta.url));
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'MihawkOS-Compatibility' };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(RELEASES_URL, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const versions = releaseVersions(await res.json());
    if (!versions.length) throw new Error('no release');
    await writeFile(file, JSON.stringify(versions, null, 1) + '\n');
    console.log(`versions ${versions.length}, newest ${versions[0]}`);
  } catch (err) {
    console.log(`GitHub releases not read (${err.message}): data/versions.json is left as it is.`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
