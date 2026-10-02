// report.mjs: compare micro's highlighting of the corpus with TypeScript's
// syntactic classifier, character by character, and write REPORT.md.
// Run fetch.mjs first. Usage: node test/gaps/report.mjs
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const testDir = join(here, '..');
const corpusDir = join(here, '.corpus');
const corpus = JSON.parse(await readFile(join(here, 'corpus.json'), 'utf8'));
// path: the cached file (see fetch.mjs); name: how REPORT.md shows it
const files = corpus.flatMap(({ repo, sha, paths }) =>
  paths.map((p) => ({ path: join(corpusDir, repo, sha, p), name: join(repo, p) })),
);

// ─── Reference: TypeScript's classes per UTF-16 index ──────────────────────
// The syntactic classifier calls a regex a string and a type reference an
// identifier, so the syntax tree corrects both. `inTemplate` marks the
// expressions inside `${…}`, which micro paints as one span.
function classify(path, text) {
  const tsx = path.endsWith('.tsx');
  const host = {
    getScriptFileNames: () => [path],
    getScriptVersion: () => '1',
    getScriptSnapshot: (f) => (f === path ? ts.ScriptSnapshot.fromString(text) : undefined),
    getCurrentDirectory: () => '/',
    getCompilationSettings: () => ({ jsx: ts.JsxEmit.Preserve }),
    getDefaultLibFileName: () => 'lib.d.ts',
    fileExists: (f) => f === path,
    readFile: () => undefined,
  };
  const { spans } = ts
    .createLanguageService(host)
    .getEncodedSyntacticClassifications(path, { start: 0, length: text.length });
  const cls = new Array(text.length).fill(null);
  for (let i = 0; i < spans.length; i += 3) {
    let name = ts.ClassificationType[spans[i + 2]];
    const word = text.slice(spans[i], spans[i] + spans[i + 1]);
    if (name === 'keyword' && word in KEYWORD_LITERALS) name = `keyword ${word}`;
    else if (name === 'keyword' && TYPE_KEYWORDS.has(word)) name = 'type keyword';
    else if (name === 'identifier' && (word === 'undefined' || word === 'NaN')) name = 'keyword undefined';
    cls.fill(name, spans[i], spans[i] + spans[i + 1]);
  }
  const inTemplate = new Array(text.length).fill(false);
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, tsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const mark = (node, name) => cls.fill(name, node.getStart(sf), node.end);
  const lastName = (n) => (ts.isQualifiedName(n) ? n.right : ts.isPropertyAccessExpression(n) ? n.name : n);
  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.RegularExpressionLiteral) mark(node, 'regex');
    else if (ts.isIdentifier(node) && ts.isPropertyAssignment(node.parent) && node.parent.name === node) {
      // a key named `undefined` or `NaN` is a plain name, not the value
      if (node.text === 'undefined' || node.text === 'NaN') mark(node, 'identifier');
    }
    else if (ts.isTypeReferenceNode(node)) {
      // `as const` parses as a reference to a type named `const`
      const name = lastName(node.typeName);
      mark(name, name.text === 'const' ? 'keyword' : 'typeReference');
    }
    else if (ts.isExpressionWithTypeArguments(node) && ts.isHeritageClause(node.parent)) {
      mark(lastName(node.expression), 'typeReference');
    } else if (ts.isTemplateSpan(node)) {
      inTemplate.fill(true, node.expression.getStart(sf), node.literal.getStart(sf));
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { cls, inTemplate };
}

// ─── Mapping from TypeScript classes to micro groups ───────────────────────
const KEYWORD_LITERALS = { true: 'constant.bool.true', false: 'constant.bool.false', null: 'constant', undefined: 'constant' };
const TYPE_KEYWORDS = new Set(['any', 'bigint', 'boolean', 'never', 'number', 'object', 'string', 'symbol', 'unknown']);
const isType = (g) => g === 'type' || g.startsWith('type.');
const isTag = (g) => g === 'statement.tag' || g === 'type.tag';
const isComment = (g) => g === 'comment' || g === 'todo' || g === 'identifier';
const isName = (g) => g.startsWith('statement') || g.startsWith('constant') || g === 'type.types';

// ACCEPT: the class should be coloured, with one of these groups.
const ACCEPT = {
  keyword: (g) => g.startsWith('statement'),
  'type keyword': (g) => g === 'type.types',
  ...Object.fromEntries(Object.entries(KEYWORD_LITERALS).map(([w, group]) => [`keyword ${w}`, (g) => g === group])),
  stringLiteral: (g) => /^constant\.(string|quotes|stringEscaped|tplLiterals)/.test(g),
  regex: (g) => g === 'constant.string.regex' || g === 'constant.specialChar',
  numericLiteral: (g) => g === 'constant.number',
  bigintLiteral: (g) => g === 'constant.number',
  comment: isComment,
  docCommentTagName: isComment,
  className: isType,
  enumName: isType,
  interfaceName: isType,
  typeAliasName: isType,
  typeParameterName: isType,
  moduleName: isType,
  typeReference: isType,
  jsxOpenTagName: isTag,
  jsxCloseTagName: isTag,
  jsxSelfClosingTagName: isTag,
  jsxAttribute: (g) => g === 'identifier.attribute',
  jsxAttributeStringLiteralValue: (g) => /^constant\.(string|quotes)/.test(g),
};
// FORBID: the class may stay plain, but must not get these groups.
const FORBID = {
  identifier: isName,
  parameterName: isName,
  jsxText: isName,
  operator: (g) => g === 'constant.string.regex',
  punctuation: (g) => g === 'constant.string.regex',
};

function verdict(cls, group, inTemplate) {
  if (inTemplate && group === 'constant.tplLiterals.expression') return 'ok';
  if (ACCEPT[cls]) return !group ? 'missing' : ACCEPT[cls](group) ? 'ok' : 'wrong';
  if (FORBID[cls]) return group && FORBID[cls](group) ? 'wrong' : 'ok';
  return null;
}

// ─── Compare ───────────────────────────────────────────────────────────────
const dump = JSON.parse(
  execFileSync('go', ['run', './cmd/dump', '-root', '..', ...files.map((f) => f.path)], { cwd: testDir, maxBuffer: 1 << 28 }),
);
const rows = new Map();
const totals = { ok: 0, wrong: 0, missing: 0, skippedLines: 0 };
for (const { path, name } of files) {
  const text = await readFile(path, 'utf8');
  const { cls, inTemplate } = classify(path, text);
  const lines = text.split('\n');
  let offset = 0;
  lines.forEach((line, n) => {
    const chars = Array.from(line);
    const groups = dump[path][n];
    if (groups.length !== chars.length) {
      // micro merges combining marks into one character; skip such lines
      totals.skippedLines++;
    } else {
      let i = offset;
      chars.forEach((ch, col) => {
        const g = groups[col] === 'default' ? '' : groups[col];
        const v = verdict(cls[i], g, inTemplate[i]);
        if (v) totals[v]++;
        if (v === 'wrong' || v === 'missing') {
          const key = `${v}\t${cls[i]}\t${g || '(none)'}`;
          const row = rows.get(key) ?? { count: 0, examples: new Map() };
          row.count++;
          if (row.examples.size < 3) row.examples.set(`${name}:${n + 1}`, line.trim().slice(0, 120));
          rows.set(key, row);
        }
        i += ch.length;
      });
    }
    offset += line.length + 1;
  });
}

// ─── Write REPORT.md ───────────────────────────────────────────────────────
const judged = totals.ok + totals.wrong + totals.missing;
const pct = (n) => ((100 * n) / judged).toFixed(1);
const out = [
  '# Gap report',
  '',
  'Generated by `pnpm gaps`: micro (v2.0.15 engine) against the TypeScript',
  `${ts.version} syntactic classifier. Do not edit by hand.`,
  '',
  'Corpus: ' + corpus.map(({ repo, sha, paths }) => `${repo}@${sha.slice(0, 7)} (${paths.length})`).join(', ') + '.',
  '',
  `Agreement: **${pct(totals.ok)}%** of ${judged} judged characters.`,
  `Wrong colour: ${totals.wrong} (${pct(totals.wrong)}%). Missing colour: ${totals.missing} (${pct(totals.missing)}%).`,
  `Lines skipped (combining marks): ${totals.skippedLines}.`,
];
for (const [kind, title, blurb] of [
  ['wrong', 'Wrong colour', 'micro paints a group the classifier contradicts.'],
  ['missing', 'Missing colour', 'the classifier names the span; micro leaves it plain.'],
]) {
  out.push('', `## ${title}`, '', `Rows where ${blurb} Characters, TS class → micro group.`);
  const ranked = [...rows].filter(([k]) => k.startsWith(kind + '\t')).sort((a, b) => b[1].count - a[1].count);
  for (const [key, { count, examples }] of ranked.slice(0, 40)) {
    const [, cls, group] = key.split('\t');
    out.push('', `### ${count} · ${cls} → ${group}`, '', '```text');
    for (const [where, line] of examples) out.push(`${where}  ${line}`);
    out.push('```');
  }
  if (ranked.length > 40) out.push('', `…and ${ranked.length - 40} smaller rows.`);
}
await writeFile(join(here, 'REPORT.md'), out.join('\n') + '\n');
console.log(`agreement ${pct(totals.ok)}%: wrong ${totals.wrong}, missing ${totals.missing}; wrote test/gaps/REPORT.md`);
