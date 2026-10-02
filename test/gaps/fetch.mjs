// fetch.mjs: download the corpus in corpus.json into .corpus/, pinned by
// commit, skipping files already there.
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// CORPUS overrides the corpus file, e.g. to check a failing download.
const corpus = JSON.parse(await readFile(process.env.CORPUS ?? join(here, 'corpus.json'), 'utf8'));

for (const { repo, sha, paths } of corpus) {
  for (const path of paths) {
    const dest = join(here, '.corpus', repo, path);
    try {
      await access(dest);
      continue;
    } catch {}
    const url = `https://raw.githubusercontent.com/${repo}/${sha}/${path.split('/').map(encodeURIComponent).join('/')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, await res.text());
    console.log(`fetched ${repo}/${path}`);
  }
}
