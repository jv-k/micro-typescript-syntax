# Highlight tests and gap report — design

Date: 2026-10-02. Status: implemented. Gaps b, c, d and g closed; see `docs/superpowers/plans/`.

## Goal

1. Unit tests for every rule in `typescript-rules.yaml` and `jsx-tags.yaml`,
   run on micro's real highlight engine, with proof that each rule is tested.
2. A gap report that measures the highlighter against TypeScript's own
   syntactic classifier, so fixes target real, ranked gaps instead of guesses.
3. Gap fixes, chosen from the report and made test-first.

Non-goals: zero gaps (micro paints each rule over whole lines with RE2 and keeps
no token state, so some gaps are permanent); changing micro itself; a CI gate
on the gap report.

## 1. Harness

- `test/` is its own Go module (`test/go.mod`), so the repository root — what
  users clone into micro's `plug/` directory — gets no Go files. It depends on
  `github.com/zyedidia/micro/v2` pinned to **v2.0.15** (the release Homebrew
  ships) and imports only `pkg/highlight`.
- **Loader** (`test/load.go`): reads `typescript.yaml`, `tsx.yaml`,
  `typescript-rules.yaml`, `jsx-tags.yaml` from the repo root, builds a `Def`
  per filetype with `ParseFile` → `ParseDef` → `ResolveIncludes`, as micro does
  at runtime. It accepts in-memory YAML overrides so the mutation check can
  swap in a mutated rules file.
- **Groups per character**: `HighlightString` returns, per line, a map from
  column to the group that starts there. The group at column `c` is the entry
  with the greatest key `≤ c`, or default when there is none. Confirm this
  matches micro's display code (`internal/display/bufwindow.go`) while
  building the harness, including a region that carries over from the line
  above. Columns are runes. A fixture containing a tab fails to load.

## 2. Fixtures

- One file per rule section in `test/fixtures/`:
  `declared-names.ts`, `symbols.ts`, `keywords.ts`, `types.ts`,
  `keywords-as-names.ts`, `literals.ts`, `numbers.ts`, `regex.ts`,
  `comments.ts`, `strings.ts`, `templates.ts`, `jsx.tsx`. The extension picks
  the filetype.
- **Assertion line**: a line whose first non-space text is `//` followed by
  only spaces and a run of `^`, then a group:

  ```ts
  const r = /ab+c/g;
  //        ^^^^^^^ constant.string.regex
  const y = arr[i]/n/2;
  //              ^^^ !constant.string.regex
  if (ok) /re/.test(s);
  //      ^^^^ constant.string.regex  KNOWN-GAP
  ```

  - It applies to the nearest code line above it (assertion lines are skipped
    when looking up). Several assertion lines may follow one code line.
  - `group`: every caret column has exactly that group (exact match:
    `constant.string` does not satisfy `constant.string.regex`).
  - `!group`: no caret column has that group.
  - `default`: the column has no group.
  - `KNOWN-GAP`: the assertion is expected to fail. If it passes, the test
    fails with "known gap fixed: promote it and remove it from the README edge
    cases". Every README edge case that has a code example gets a `KNOWN-GAP`
    assertion on that example; CONTRIBUTING states this rule (not automated:
    some edge cases, such as the micro#4022 one, have no example to test).
- **Failure output**: file:line, the code line, a caret line, expected group,
  and the actual group of each failing column.
- `TestFixtures` runs every fixture, one subtest per file.

## 3. Mutation check

- `TestEveryRuleIsCovered` parses each rules file as a `yaml.Node` tree and
  lists these mutants:
  - each pattern rule, at top level and inside a region's `rules:`;
  - each region, removed whole;
  - each region's `skip:` key, removed.
- For each mutant: serialise the tree without that item, load it in memory,
  run all fixtures of the filetypes that include the file (`jsx-tags.yaml`
  only reaches `.tsx` fixtures). If no non-`KNOWN-GAP` assertion fails, the
  mutant is uncovered.
- The test fails with every uncovered item: file, YAML line, group, pattern.
  A rule that is uncovered because another rule duplicates it is removed, not
  tested.

## 4. Gap report

- **Corpus**: `test/gaps/corpus.json` lists sources pinned by commit SHA:
  `{repo, sha, paths[]}`. Candidates, chosen and pinned during
  implementation for a mix of plain TS, heavy types, regexes and TSX, about
  3–6k lines total:
  - `microsoft/TypeScript` — `src/compiler/scanner.ts`;
  - `colinhacks/zod` — core type files;
  - `shadcn-ui/ui` — a set of `.tsx` components;
  - `vercel/next.js` — one example app's `.tsx` pages.
  `test/gaps/fetch.mjs` downloads them from `raw.githubusercontent.com` into
  the gitignored `test/gaps/.corpus/`, skipping files already cached.
- **Micro side**: `test/cmd/dump` (Go) prints the group of every character in
  each file as JSON, using the harness loader.
- **Reference side**: `test/gaps/report.mjs` runs
  `ts.getEncodedSyntacticClassifications` (from the `typescript`
  devDependency pinned to 6.0.3; TypeScript 7 has no JS language service, no
  type check) per file, then compares it with the dump, character by
  character, using the table below. The classifier calls a regex a
  `stringLiteral` and a type reference an `identifier`, so the script walks
  the syntax tree to relabel `RegularExpressionLiteral` nodes as
  `regularExpressionLiteral`, and type-reference and heritage-clause names as
  `typeReference` (accepted as `type*`). It also accepts `constant` for the
  identifiers `undefined` and `NaN`, treats `const` in `as const` as a
  keyword, and accepts `constant.tplLiterals.expression` anywhere inside
  `${…}`.

  | TS classification | Accepted micro groups |
  |---|---|
  | keyword | `statement*`. Except `true`/`false` → `constant.bool.*`; `null`/`undefined` → `constant`; `any`/`bigint`/`boolean`/`never`/`number`/`object`/`string`/`symbol`/`unknown` → `type.types` |
  | stringLiteral (including template parts) | `constant.string*`, `constant.quotes`, `constant.stringEscaped`; inside `${…}`, `constant.tplLiterals.expression` |
  | regularExpressionLiteral | `constant.string.regex`, `constant.specialChar` |
  | numericLiteral, bigintLiteral | `constant.number` |
  | comment, docCommentTagName | `comment`, `todo`, `identifier` |
  | className, interfaceName, typeAliasName, enumName, typeParameterName, moduleName | `type*` |
  | jsxOpenTagName, jsxCloseTagName, jsxSelfClosingTagName | `statement.tag`, `type.tag` |
  | jsxAttribute | `identifier.attribute` |
  | identifier, parameterName, jsxText | anything except `statement*`, `constant*`, `type.types`; `type` is accepted for built-in names (`Promise`, `ReactNode`, …) |
  | operator, punctuation, jsxAttributeStringLiteralValue | not `constant.string.regex`; `jsxAttributeStringLiteralValue` must be `constant.string*` or `constant.quotes` |
  | whiteSpace, text | ignored |

- **Output**: `test/gaps/REPORT.md`, committed as a scoreboard. Sections:
  wrong colour (micro paints what the classifier contradicts) and missing
  colour (the classifier names a span micro leaves plain). Rows are grouped by
  `(TS class → micro group)`, ranked by character count, each with up to three
  example lines (`file:line` plus the line). A header gives totals and the
  agreement percentage.
- `pnpm gaps` runs fetch → dump → report. Not part of `pnpm test` or CI.

## 5. Gap fixes

After the first report, present the ranked gaps; the user picks which to
close. Each fix: add a failing fixture assertion, change the rule, make
`pnpm test` green (mutation check included), rerun `pnpm gaps` and check the
row shrank without new wrong-colour rows. Gaps that cannot be closed become
`KNOWN-GAP` assertions and README edge cases.

## 6. Wiring

- `package.json`: `"test": "cd test && go test ./..."`,
  `"gaps": "node test/gaps/fetch.mjs && node test/gaps/report.mjs"`;
  devDependency `typescript` (pinned).
- `.github/workflows/test.yml`: on push and pull request, `actions/setup-go`
  with `go-version-file: test/go.mod`, then `go test ./...` in `test/`.
- `.gitignore`: `test/gaps/.corpus/`.
- `CONTRIBUTING.md`: how to add a fixture assertion, run tests, read the
  mutation output, and refresh the gap report.
- Existing `sample.ts`/`sample.tsx` stay as visual samples for manual
  checking; their cases move into fixtures.

## Risks

- **Engine drift**: micro after v2.0.15 (e.g. micro#4022) changes some
  colouring. Tests pin v2.0.15; bump the pin deliberately and re-run.
- **Classifier mismatch**: TS classifies some spans micro deliberately
  treats differently (e.g. built-in type names are identifiers to TS). The
  table accepts these; refine the table, not the rules, when a row is a
  mapping artefact.
- **Corpus fetch** needs network; tests do not.
