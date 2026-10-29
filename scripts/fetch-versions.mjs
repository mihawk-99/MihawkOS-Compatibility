// SPDX-License-Identifier: GPL-3.0-or-later
// data/versions.json: MihawkOS's releases, newest first, the report page's version list. Each Publish run reads them
// from GitHub, so a new release is offered within about 15 minutes; when GitHub does not answer, the file is kept.
//
//   [GITHUB_TOKEN=...] node scripts/fetch-versions.mjs
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { cleanVersion } from './build-reports.mjs';

const REPO = 'mihawk-99/PS5_MihawkOS';

// GitHub lists releases newest first; drafts and tags not shaped like v1.2.3-alpha-4 are left out.
export function releaseVersions(releases) {
  const versions = [];
  for (const r of Array.isArray(releases) ? releases : []) {
    const v = !r?.draft && cleanVersion(r?.tag_name);
    if (v && !versions.includes(v)) versions.push(v);
  }
  return versions;
}

async function main() {
  const file = fileURLToPath(new URL('../data/versions.json', import.meta.url));
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'MihawkOS-Compatibility' };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, { headers, signal: AbortSignal.timeout(15000) });
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
