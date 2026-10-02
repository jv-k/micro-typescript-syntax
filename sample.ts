/* eslint-disable no-console */
import fs from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';

type Params = {
  user: string;
  repo: string;
  branch: string;
  docsPath: string;
  outputPath: string;
};

async function fetchRemoteFilePaths({
  user,
  repo,
  branch,
  docsPath,
  outputPath,
}: Params): Promise<void> {
  async function fillNestedMeta(metaPaths: string[]): Promise<Record<string, unknown>> {
    const result = Object.create(null);
    let index = 0;
    let metaPath;
    while ((metaPath = metaPaths[index++])) {
      const response = await fetch(
        `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${docsPath}${metaPath}`,
      );
      const metaData = await response.json();
      const dir = metaPath.split('/').slice(0, -1);

      if (dir.length === 0) {
        Object.assign(result, metaData);
      } else if (dir.length === 1) {
        result[dir[0]] = {
          type: 'folder',
          items: metaData,
        };
      } else {
        throw new Error('❌ Not implemented for nested directories');
      }
    }
    return result;
  }

  const url = `https://api.github.com/repos/${user}/${repo}/git/trees/${branch}?recursive=1`;
  const response = await fetch(url);

  const data = await response.json();
  if (data.message) {
    console.error('❌ GitHub API rate limit exceeded, skipping…', JSON.stringify(data, null, 2));
    process.exit(0);
  }
  const filePaths = (data.tree as { path: string }[])
    .filter(item => item.path.startsWith(docsPath))
    .map(item => item.path.replace(docsPath, ''));

  const result = {
    user,
    repo,
    branch,
    docsPath,
    filePaths: filePaths.filter(filePath => /\.mdx?$/.test(filePath)),
    nestedMeta: await fillNestedMeta(filePaths.filter(filePath => filePath.endsWith('_meta.json'))),
  };
  const json = JSON.stringify(result, null, 2);

  await fs.writeFile(outputPath, await prettier.format(json, { parser: 'json' }), 'utf8');

  console.log(`✅ Remote files from "${url}" saved!`);
}

fetchRemoteFilePaths({
  user: 'dotansimha',
  repo: 'graphql-yoga',
  // last commit with v2 source docs
  branch: '291daaaf3921b2ab875d988b7a7880ee277f247e',
  docsPath: 'website/src/pages/v2/',
  outputPath: path.join(process.cwd(), 'remote-files', 'v2.json'),
});

// ─── Highlighting edge cases ───────────────────────────────────────────────

const x=5;
const { a, b } = o;
const n: number = 1;
let i = 0; var v = 1;
function* gen() {}
const big = 1_000_000 + 10n + 0b1010 + 0o17 + 0xFF + 08 + 1.5e-3 + .5;
const d = x-1;
const s = '${notInterpolated}' + "${nope}";
const t = `a \` b ${fn({ a })} c ${ {k: 1}.k }`;
map.get(k); item.type; module.exports;
const o2 = { type: 'folder', get: 1, default: 2 };
switch (x) { case 1: break; default: break; }
const r = c ? true : false;
type K = keyof T; const y = z satisfies T;
const enum E { A }
/* path \*/ const after = 1;
let opt?: string;
a?.b ?? c;
const fn = (a: string, b?: number): Promise<void> => {};
const C: FC<Props> = async ({ x }) => x;
const M: Map<string, Array<number>> = () => new Map();
function withCb(a: string, cb = (x) => x) {}
const inc = x => x + 1;
this.handler = (e) => e;
const o = { onClick: (e: Event) => go(e), plain: 1 };
const type = 'x'; let get = 1;
const re = /["'`]/g; const s = 'after regex';
if (/^\/\//.test(u)) { x = 1; } // real comment
const ratio = a / b / c; const r2 = a/b/c;
paths.join('/a', '/b');
return /a[/]b/i.test(s);
module.exports = { default: 2 };
of(1).pipe(from(x));
switch (k) {
  default:
    break;
}
const t = `${a}/${b}/`;
const ok = 'still a string';
