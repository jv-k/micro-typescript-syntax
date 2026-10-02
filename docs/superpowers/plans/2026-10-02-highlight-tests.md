# Highlight Tests and Gap Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unit-test every rule in the micro syntax files on micro's own highlight engine, prove each rule is load-bearing, and measure the highlighter against TypeScript's classifier to rank the gaps worth fixing.

**Architecture:** A Go test module in `test/` loads the syntax files with micro v2.0.15's `pkg/highlight` and checks caret-annotated fixture files. A mutation test deletes each rule, region and `skip:` in turn and requires some fixture assertion to fail. A Node script compares micro's output (via a Go `dump` command) with TypeScript 6.0.3's syntactic classifier over a pinned public corpus and writes a ranked `REPORT.md`.

**Tech Stack:** Go 1.26, `github.com/zyedidia/micro/v2` v2.0.15, `gopkg.in/yaml.v3` v3.0.1, Node 26, `typescript` 6.0.3, pnpm, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-02-highlight-tests-design.md`

Every code block below was run in a scratch copy of this repository while
writing the plan: the harness tests, all fixtures and the mutation check pass
on the rules as they will be after Task 4, and the gap report ran on the corpus.

## Global Constraints

- Micro engine pinned: `github.com/zyedidia/micro/v2 v2.0.15` (the Homebrew release); import only `pkg/highlight`.
- `typescript` devDependency pinned to `6.0.3`. TypeScript 7 is the native port and has no JS language service (`ts.createLanguageService` is undefined).
- All Go code lives in `test/` (module `github.com/jv-k/micro-typescript-syntax/test`). Nothing Go at the repository root: users clone the root into micro's `plug/` directory.
- Fixtures: LF line endings, no tabs, no combining marks, assertion carets at column 2 or later (the `//` takes columns 0–1). Indent code lines by two spaces.
- The gap report is not part of `pnpm test` or CI. The corpus is pinned by commit SHA and cached in the gitignored `test/gaps/.corpus/`.
- Commits: Conventional Commits with scope (`test(syntax):`, `fix(syntax):`, `ci:`, `docs(contributing):`, `chore(repo):`). Stage explicit paths only; never `git add -A`.
- Docs in this repo use simplified English (short sentences, no idioms). Match it in CONTRIBUTING.

## Review Focus

- A fixture with a combining mark (`é` written as `e` + U+0301): micro counts it as one character, so caret columns would drift. `ParseFixture` must reject it with the line number. Pinned in Task 2 (`TestParseFixtureErrors`, case `combining`) and Task 1 (`TestGroupsCountsCharactersLikeMicro`).
- A fixture checked out with CRLF endings: `\r` would sit at the end of every code line and shift `$`-anchored regions. `ParseFixture` must reject it. Pinned in Task 2 (case `crlf`).
- An assertion line inside a multi-line template literal or block comment: if left in place it would become part of the region and change the colours under test. Assertion lines are removed before highlighting. Pinned in Task 2 (`TestParseFixture` checks code lines exclude assertions) and Task 3 (`templates.ts`, `comments.ts` span lines).
- A mutation run while `TestFixtures` already fails: every mutant would look caught. `TestEveryRuleIsCovered` must stop with "fix it first". Pinned in Task 4 (Step 6 breaks a fixture on purpose and checks the message).
- A corpus pin that no longer resolves (bad SHA, renamed path): `fetch.mjs` must exit non-zero naming the URL and must not leave a partial file. Pinned in Task 6 (Step 5, `CORPUS=` override).

---

### Task 1: Go test module and loader

**Files:**
- Create: `test/go.mod`, `test/go.sum` (generated)
- Create: `test/load.go`
- Test: `test/load_test.go`

**Interfaces:**
- Produces: `var RuleFiles []string`; `type Defs map[string]*highlight.Def` keyed by filetype (`"typescript"`, `"tsx"`); `func Load(root string, overrides map[string][]byte) (Defs, error)` where an `overrides` key is a file name without `.yaml`; `func Groups(def *highlight.Def, src string) [][]string` returning the group name per character per line (`""` = no group). Test constant `root = ".."`.

- [ ] **Step 1: Commit the pending work first**

The working tree holds the `)`/`]` division rule (with its `sample.ts` lines and README edge-case change) and the spec. Commit them separately so this plan starts clean.

```bash
git add typescript-rules.yaml sample.ts README.md
git commit -m "fix(syntax): treat a slash after ) or ] as division"
git add docs/superpowers/specs/2026-10-02-highlight-tests-design.md
git commit -m "docs(spec): add the highlight tests and gap report design"
```

- [ ] **Step 2: Create the module**

```bash
mkdir -p test && cd test
go mod init github.com/jv-k/micro-typescript-syntax/test
go get github.com/zyedidia/micro/v2/pkg/highlight@v2.0.15 gopkg.in/yaml.v3@v3.0.1
```

Set the `go` line in `test/go.mod` to `go 1.26` if `go mod init` wrote a patch version.

- [ ] **Step 3: Write the failing test**

````go
package syntaxtest

import (
	"slices"
	"testing"
)

const root = ".."

func TestLoadAndGroups(t *testing.T) {
	defs, err := Load(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, ft := range []string{"typescript", "tsx"} {
		if defs[ft] == nil {
			t.Fatalf("no %s definition", ft)
		}
	}
	got := Groups(defs["typescript"], "x = /a/;\nconst s = `a\nb`;")
	want := [][]string{
		{"", "", "symbol.operator", "", "constant.string.regex", "constant.string.regex", "constant.string.regex", "symbol.punctuation"},
		{"statement.const", "statement.const", "statement.const", "statement.const", "statement.const", "identifier.const", "identifier.const", "", "symbol.operator", "", "constant.quotes", "constant.string"},
		{"constant.string", "constant.quotes", "symbol.punctuation"},
	}
	for i := range want {
		if !slices.Equal(got[i], want[i]) {
			t.Errorf("line %d:\n got  %q\n want %q", i, got[i], want[i])
		}
	}
}

func TestGroupsCountsCharactersLikeMicro(t *testing.T) {
	defs, err := Load(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	// `e` plus a combining acute accent is one character to micro
	if got := Groups(defs["typescript"], "e\u0301 = 1;")[0]; len(got) != 6 || got[4] != "constant.number" {
		t.Errorf("got %q, want 6 columns with constant.number at 4", got)
	}
}

func TestLoadOverride(t *testing.T) {
	defs, err := Load(root, map[string][]byte{"jsx-tags": []byte("filetype: jsx-tags\nrules: []\n")})
	if err != nil {
		t.Fatal(err)
	}
	if g := Groups(defs["tsx"], "<div>")[0][1]; g == "statement.tag" {
		t.Errorf("override ignored: <div> still statement.tag")
	}
}
````

- [ ] **Step 4: Run it to see it fail**

Run: `cd test && go test ./...`
Expected: FAIL to compile with `undefined: Load` and `undefined: Groups`.

- [ ] **Step 5: Write the loader**

````go
// Package syntaxtest tests the syntax files with micro's own highlighter.
package syntaxtest

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/zyedidia/micro/v2/pkg/highlight"
)

// RuleFiles are the syntax files, by name without `.yaml`.
var RuleFiles = []string{"typescript", "typescript-rules", "tsx", "jsx-tags"}

// Defs maps a filetype ("typescript" or "tsx") to its definition, with
// includes resolved.
type Defs map[string]*highlight.Def

// Load reads the syntax files from root and resolves includes the way micro
// does at runtime. An entry in overrides replaces that file's contents.
func Load(root string, overrides map[string][]byte) (Defs, error) {
	var files []*highlight.File
	defs := Defs{}
	for _, name := range RuleFiles {
		data, ok := overrides[name]
		if !ok {
			var err error
			if data, err = os.ReadFile(filepath.Join(root, name+".yaml")); err != nil {
				return nil, err
			}
		}
		f, err := highlight.ParseFile(data)
		if err != nil {
			return nil, fmt.Errorf("%s.yaml: %w", name, err)
		}
		header, err := highlight.MakeHeaderYaml(data)
		if err != nil {
			return nil, fmt.Errorf("%s.yaml: %w", name, err)
		}
		def, err := highlight.ParseDef(f, header)
		if err != nil {
			return nil, fmt.Errorf("%s.yaml: %w", name, err)
		}
		files = append(files, f)
		defs[f.FileType] = def
	}
	for _, def := range defs {
		highlight.ResolveIncludes(def, files)
	}
	return defs, nil
}

// Groups highlights src and returns the group name of every character, by
// line. Micro's display starts each line with no group and switches at each
// match key, so a character takes the group of the last key at or before it.
// "" means no group. Columns count characters as micro does: a combining
// mark belongs to the character before it.
func Groups(def *highlight.Def, src string) [][]string {
	matches := highlight.NewHighlighter(def).HighlightString(src)
	lines := strings.Split(src, "\n")
	out := make([][]string, len(lines))
	for i, line := range lines {
		row := make([]string, highlight.CharacterCountInString(line))
		cur := ""
		for c := range row {
			if g, ok := matches[i][c]; ok {
				cur = g.String()
			}
			row[c] = cur
		}
		out[i] = row
	}
	return out
}
````

- [ ] **Step 6: Run the tests**

Run: `cd test && go mod tidy && go test ./...`
Expected: `ok  github.com/jv-k/micro-typescript-syntax/test`. `test/go.mod` now lists `github.com/zyedidia/micro/v2 v2.0.15` and `gopkg.in/yaml.v3 v3.0.1` as direct requirements and `gopkg.in/yaml.v2 v2.2.8 // indirect`.

- [ ] **Step 7: Commit**

```bash
git add test/go.mod test/go.sum test/load.go test/load_test.go
git commit -m "test(syntax): load the syntax files with micro's highlighter"
```

---

### Task 2: Fixture format and checker

**Files:**
- Create: `test/fixture.go`
- Test: `test/fixture_test.go`
- Create: `test/fixtures/` (empty for now)

**Interfaces:**
- Consumes: `Load`, `Groups`, `Defs`, `root` from Task 1.
- Produces: `type Assertion struct{ Line, Target, From, To int; Group string; Negate, KnownGap bool }`; `type Fixture struct{ Name, Filetype string; Code []string; CodeLine []int; Assertions []Assertion }`; `type Failure struct{ Fixture *Fixture; Assertion Assertion; Got []string }` with `String()`; `func ParseFixture(name, src string) (*Fixture, error)`; `func LoadFixtures(dir string) ([]*Fixture, error)`; `func Check(defs Defs, f *Fixture) []Failure` (failures = assertions that do not hold, plus `KNOWN-GAP` assertions that do).

Assertion syntax, for reference: a line that is only `//`, spaces, a run of `^`, then a group, optional `!` before the group, optional `KNOWN-GAP` after it. `default` matches no group or micro's `default` group (the reset rules paint `default`; both render plain).

- [ ] **Step 1: Write the failing tests**

````go
package syntaxtest

import (
	"slices"
	"strings"
	"testing"
)

func TestParseFixture(t *testing.T) {
	f, err := ParseFixture("a.ts", "  x = /a/;\n//    ^^^ constant.string.regex\n//  ^ !constant.string.regex KNOWN-GAP\n  y;\n")
	if err != nil {
		t.Fatal(err)
	}
	if len(f.Code) != 2 || f.Code[1] != "  y;" || f.CodeLine[1] != 4 {
		t.Errorf("code lines: %q %v", f.Code, f.CodeLine)
	}
	want := []Assertion{
		{Line: 2, Target: 0, From: 6, To: 9, Group: "constant.string.regex"},
		{Line: 3, Target: 0, From: 4, To: 5, Group: "constant.string.regex", Negate: true, KnownGap: true},
	}
	if len(f.Assertions) != len(want) {
		t.Fatalf("assertions: %+v", f.Assertions)
	}
	for i, a := range want {
		if f.Assertions[i] != a {
			t.Errorf("assertion %d: got %+v want %+v", i, f.Assertions[i], a)
		}
	}
	if g, _ := ParseFixture("b.tsx", "    x\n//  ^ statement\n"); g.Filetype != "tsx" {
		t.Errorf(".tsx filetype: %q", g.Filetype)
	}
}

func TestParseFixtureErrors(t *testing.T) {
	for name, src := range map[string]string{
		"tab":       "\tx;\n// ^ statement\n",
		"crlf":      "  x;\r\n//^ statement\r\n",
		"combining": "  e\u0301;\n//^ statement\n",
		"no code":   "// ^ statement\n",
		"past end":  "x;\n//  ^^^ statement\n",
		"no assert": "x;\n",
	} {
		if _, err := ParseFixture(name+".ts", src); err == nil {
			t.Errorf("%s: no error", name)
		}
	}
}

func TestCheck(t *testing.T) {
	defs, err := Load(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	f, err := ParseFixture("c.ts", strings.Join([]string{
		"  x = /a/ + y;",
		"//    ^^^ constant.string.regex",    // holds
		"//  ^ symbol.operator",              // holds
		"//        ^ !constant.string.regex", // holds
		"//          ^ symbol.operator",      // fails: `y` has no group
		"//          ^ default KNOWN-GAP",    // known gap that holds: reported
		"//          ^ statement KNOWN-GAP",  // known gap that fails: not reported
	}, "\n"))
	if err != nil {
		t.Fatal(err)
	}
	var lines []int
	for _, e := range Check(defs, f) {
		lines = append(lines, e.Assertion.Line)
	}
	if want := []int{5, 6}; !slices.Equal(lines, want) {
		t.Errorf("failing assertion lines %v, want %v", lines, want)
	}
}

func TestFixtures(t *testing.T) {
	defs, err := Load(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	fixtures, err := LoadFixtures("fixtures")
	if err != nil {
		t.Fatal(err)
	}
	for _, f := range fixtures {
		t.Run(f.Name, func(t *testing.T) {
			for _, e := range Check(defs, f) {
				t.Error(e)
			}
		})
	}
}
````

- [ ] **Step 2: Run them to see them fail**

Run: `cd test && go test ./...`
Expected: FAIL to compile with `undefined: ParseFixture`, `undefined: Assertion`, `undefined: Check`, `undefined: LoadFixtures`.

- [ ] **Step 3: Write the fixture parser and checker**

````go
package syntaxtest

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"unicode/utf8"

	"github.com/zyedidia/micro/v2/pkg/highlight"
)

// An Assertion states the group of a span of one code line.
type Assertion struct {
	Line     int    // 1-based line of the assertion in the fixture file
	Target   int    // 0-based index of the code line in Fixture.Code
	From, To int    // rune columns, To exclusive
	Group    string // expected group; "default" also matches no group
	Negate   bool   // `!group`: no column may have the group
	KnownGap bool   // expected to fail
}

// A Fixture is a test file with its assertion lines taken out.
type Fixture struct {
	Name       string
	Filetype   string   // "typescript" or "tsx"
	Code       []string // the code lines, without assertion lines
	CodeLine   []int    // 1-based fixture line of each code line
	Assertions []Assertion
}

// A Failure is an assertion that did not hold, or a known gap that did.
type Failure struct {
	Fixture   *Fixture
	Assertion Assertion
	Got       []string // groups of the asserted columns
}

var assertionLine = regexp.MustCompile(`^(\s*//\s*)(\^+)\s+(!?)([A-Za-z][A-Za-z.]*)(\s+KNOWN-GAP)?\s*$`)

// ParseFixture splits a fixture into code lines and assertions. An assertion
// line applies to the nearest code line above it. Assertion lines are removed
// before highlighting, so they never open or close a region.
func ParseFixture(name, src string) (*Fixture, error) {
	f := &Fixture{Name: name, Filetype: "typescript"}
	if strings.HasSuffix(name, ".tsx") {
		f.Filetype = "tsx"
	}
	if strings.Contains(src, "\t") {
		return nil, fmt.Errorf("%s: contains a tab; use spaces so caret columns line up", name)
	}
	if strings.Contains(src, "\r") {
		return nil, fmt.Errorf("%s: has CRLF line endings; use LF", name)
	}
	for i, line := range strings.Split(strings.TrimSuffix(src, "\n"), "\n") {
		if highlight.CharacterCountInString(line) != utf8.RuneCountInString(line) {
			return nil, fmt.Errorf("%s:%d: contains a combining mark; caret columns can't line up", name, i+1)
		}
		m := assertionLine.FindStringSubmatch(line)
		if m == nil {
			f.Code = append(f.Code, line)
			f.CodeLine = append(f.CodeLine, i+1)
			continue
		}
		if len(f.Code) == 0 {
			return nil, fmt.Errorf("%s:%d: assertion before any code line", name, i+1)
		}
		a := Assertion{
			Line:     i + 1,
			Target:   len(f.Code) - 1,
			From:     utf8.RuneCountInString(m[1]),
			Negate:   m[3] == "!",
			Group:    m[4],
			KnownGap: m[5] != "",
		}
		a.To = a.From + len(m[2])
		if n := utf8.RuneCountInString(f.Code[a.Target]); a.To > n {
			return nil, fmt.Errorf("%s:%d: carets run past the end of line %d", name, a.Line, f.CodeLine[a.Target])
		}
		f.Assertions = append(f.Assertions, a)
	}
	if len(f.Assertions) == 0 {
		return nil, fmt.Errorf("%s: no assertions", name)
	}
	return f, nil
}

// LoadFixtures parses every .ts and .tsx file in dir.
func LoadFixtures(dir string) ([]*Fixture, error) {
	paths, err := filepath.Glob(filepath.Join(dir, "*.ts*"))
	if err != nil {
		return nil, err
	}
	var out []*Fixture
	for _, p := range paths {
		data, err := os.ReadFile(p)
		if err != nil {
			return nil, err
		}
		f, err := ParseFixture(filepath.Base(p), string(data))
		if err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, nil
}

func holds(a Assertion, got []string) bool {
	for _, g := range got {
		match := g == a.Group || (a.Group == "default" && g == "")
		if match == a.Negate {
			return false
		}
	}
	return true
}

// Check highlights the fixture with defs and returns its failures: each
// assertion that does not hold, and each KNOWN-GAP assertion that does.
func Check(defs Defs, f *Fixture) []Failure {
	groups := Groups(defs[f.Filetype], strings.Join(f.Code, "\n"))
	var out []Failure
	for _, a := range f.Assertions {
		got := groups[a.Target][a.From:a.To]
		if holds(a, got) == a.KnownGap {
			out = append(out, Failure{f, a, got})
		}
	}
	return out
}

func (e Failure) String() string {
	a, f := e.Assertion, e.Fixture
	want := a.Group
	if a.Negate {
		want = "not " + want
	}
	what := "want " + want
	if a.KnownGap {
		what = "KNOWN-GAP now holds (" + want + "): remove KNOWN-GAP and the README edge case"
	}
	got := slices.Compact(slices.Clone(e.Got))
	for i, g := range got {
		if g == "" {
			got[i] = "(none)"
		}
	}
	return fmt.Sprintf("%s:%d: %s, got %s\n    %s\n    %s%s",
		f.Name, a.Line, what, strings.Join(got, ", "),
		f.Code[a.Target], strings.Repeat(" ", a.From), strings.Repeat("^", a.To-a.From))
}
````

- [ ] **Step 4: Run the tests**

Run: `mkdir -p test/fixtures && cd test && go test ./...`
Expected: PASS. `TestFixtures` passes with no subtests because `fixtures/` is empty.

- [ ] **Step 5: Commit**

```bash
git add test/fixture.go test/fixture_test.go
git commit -m "test(syntax): add caret-annotated fixtures and the checker"
```

---

### Task 3: Fixtures for every rule section

**Files:**
- Create: `test/fixtures/declared-names.ts`, `symbols.ts`, `keywords.ts`, `types.ts`, `keywords-as-names.ts`, `literals.ts`, `numbers.ts`, `regex.ts`, `comments.ts`, `strings.ts`, `templates.ts`, `jsx.tsx`

**Interfaces:**
- Consumes: `TestFixtures` from Task 2 runs every file in `test/fixtures/`.
- Produces: the fixture set the mutation check (Task 4) measures coverage against. `KNOWN-GAP` assertions match the README edge cases that have examples.

These record the intended behaviour of each rule. Columns were generated from
micro's output and then each assertion was chosen by intent, so a failing
assertion here means a rule regressed, not that the fixture needs updating.

- [ ] **Step 1: Write `test/fixtures/declared-names.ts`**

````ts
  // Declared names: const, arrow functions, function declarations.
  const total = 1;
//      ^^^^^ identifier.const
  const fn = (a) => a;
//      ^^ identifier.function
//            ^ default
  const typed: Handler = async (e): Promise<void> => {};
//      ^^^^^ identifier.function
//             ^^^^^^^ default
//                              ^ default
  const obj = { onClick: (e: Event) => go(e) };
//              ^^^^^^^ identifier.function
//                           ^^^^^ !identifier.function
  withCb(a, cb = (x) => x);
//          ^^ identifier.function
//^^^^^^ default
  const inc = x => x + 1;
//      ^^^ identifier.function
  function named(a) {}
//^^^^^^^^ statement.function
//         ^^^^^ identifier.function
  function* gen() {}
//^^^^^^^^^ statement.function
//          ^^^ identifier.function
  const type = 'x'; const as = 1;
//^^^^^ statement.const
//      ^^^^ identifier.const
//                        ^^ identifier.const
  let get = 1; var from = 2;
//^^^ statement.let
//    ^^^ default
//             ^^^ statement.var
//                 ^^^^ default
  const f2 = (a = g()) => a;
//      ^^ identifier.function KNOWN-GAP
  ok ? a : (b) => b;
//     ^ default KNOWN-GAP
````

- [ ] **Step 2: Write `test/fixtures/symbols.ts`**

````ts
  call(a[0], { b: c });
//    ^ symbol.brackets
//      ^ symbol.brackets
//        ^ symbol.brackets
//           ^ symbol.braces
//                  ^ symbol.braces
//                   ^ symbol.brackets
  x = a + b - c * d % e;
//  ^ symbol.operator
//      ^ symbol.operator
//          ^ symbol.operator
//              ^ symbol.operator
//                  ^ symbol.operator
  a.b, c; d;
// ^ symbol.punctuation
//   ^ symbol.punctuation
//      ^ symbol.punctuation
  !x && y || z ^ w | v & u ~ t;
//^ symbol.operator
//   ^^ symbol.operator
//        ^^ symbol.operator
//             ^ symbol.operator
//                         ^ symbol.operator
  x <= y >= z;
//  ^^ symbol.operator
//       ^^ symbol.operator
````

- [ ] **Step 3: Write `test/fixtures/keywords.ts`**

````ts
  abstract class A extends B implements C {}
//^^^^^^^^ statement
//         ^^^^^ statement.class
//                 ^^^^^^^ statement
//                           ^^^^^^^^^^ statement
  async function f() { await g(); }
//^^^^^ statement
//                     ^^^^^ statement
  if (a) {} else {} for (k of o) {} while (x) {} do {}
//^^ statement
//          ^^^^ statement
//                  ^^^ statement
//                         ^^ statement
//                                  ^^^^^ statement
//                                               ^^ statement
  try {} catch (e) {} finally {} debugger;
//^^^ statement
//       ^^^^^ statement
//                    ^^^^^^^ statement
//                               ^^^^^^^^ statement
  switch (k) { case 1: break; }
//^^^^^^ statement
//             ^^^^ statement
//                     ^^^^^ statement
  switch (k) {
    default:
//  ^^^^^^^^ statement
      continue;
//    ^^^^^^^^ statement
    default: {
//  ^^^^^^^^ statement
    default: return;
//  ^^^^^^^^ statement
  }
  export default x;
//^^^^^^ statement
//       ^^^^^^^ statement
  import { a } from 'b';
//^^^^^^ statement
//             ^^^^ statement
  return new X(); throw e; delete o.p; typeof x; void 0; yield v;
//^^^^^^ statement
//       ^^^ statement
//                ^^^^^ statement
//                         ^^^^^^ statement
//                                     ^^^^^^ statement
//                                               ^^^^ statement
//                                                       ^^^^^ statement
  x instanceof Y; k in o; x as T; x satisfies T;
//  ^^^^^^^^^^ statement
//                  ^^ statement
//                          ^^ statement
//                                  ^^^^^^^^^ statement
  declare module 'm'; namespace N {} interface I {} enum E {}
//^^^^^^^ statement
//        ^^^^^^ statement
//                    ^^^^^^^^^ statement
//                                   ^^^^^^^^^ statement
//                                                  ^^^^ statement
  const enum Dir {}
//^^^^^ statement.const
//      ^^^^ statement
  public private protected readonly static override accessor
//^^^^^^ statement
//       ^^^^^^^ statement
//               ^^^^^^^^^ statement
//                         ^^^^^^^^ statement
//                                  ^^^^^^ statement
//                                         ^^^^^^^^ statement
//                                                  ^^^^^^^^ statement
  keyof T; infer U; asserts x is string; unique symbol;
//^^^^^ statement
//         ^^^^^ statement
//                  ^^^^^^^ statement
//                            ^^ statement
//                                       ^^^^^^ statement
  var a; let b; type T = U;
//^^^ statement.var
//       ^^^ statement.let
//              ^^^^ statement.const
  get x() {} set y(v) {} super.m(); this.n; with (o) {} using r = s;
//^^^ statement
//           ^^^ statement
//                       ^^^^^ statement
//                                  ^^^^ statement
//                                          ^^^^ statement
//                                                      ^^^^^ statement
  package p; constructor() {} require('x');
//^^^^^^^ statement
//           ^^^^^^^^^^^ statement
//                            ^^^^^^^ statement
````

- [ ] **Step 4: Write `test/fixtures/types.ts`**

````ts
  Array Boolean Date Error Function Map Math Number Object BigInt Enumerator
//^^^^^ type
//                                                                ^^^^^^^^^^ type
  Promise RegExp Set String Symbol WeakMap WeakSet
//^^^^^^^ type
//                                         ^^^^^^^ type
  Awaited Omit Parameters Partial Pick Readonly Record Required ReturnType
//^^^^^^^ type
//                                                              ^^^^^^^^^^ type
  let a: any, b: never, c: unknown, d: string;
//       ^^^ type.types
//               ^^^^^ type.types
//                         ^^^^^^^ type.types
//                                     ^^^^^^ type.types
  ComponentProps CSSProperties FC JSX ReactNode SetStateAction
//^^^^^^^^^^^^^^ type
//                                              ^^^^^^^^^^^^^^ type
  AppProps GetServerSideProps Metadata NextPage NextResponse
//^^^^^^^^ type
//                                              ^^^^^^^^^^^^ type
  const [s, setS] = useState(0); useRouter(); user(); reuseIt();
//                  ^^^^^^^^ identifier.function.hook
//                               ^^^^^^^^^ identifier.function.hook
//                                            ^^^^ default
//                                                    ^^^^^^^ default
  ArrayBuffer; MyPromise; class Foo {}
//^^^^^^^^^^^ default
//             ^^^^^^^^^ default
````

- [ ] **Step 5: Write `test/fixtures/keywords-as-names.ts`**

````ts
  item.type; p.catch(); a. new; x.this;
//     ^^^^ default
//             ^^^^^ default
//                         ^^^ default
//                                ^^^^ default
//            ^ symbol.punctuation
  x = { type: 'a', default: 1, from?: 2 };
//      ^^^^ default
//                 ^^^^^^^ default
//                             ^^^^ default
//                                 ^ symbol.operator
//                                  ^ symbol.operator
  module.exports = y; type.x; from.y;
//^^^^^^ default
//                    ^^^^ default
//                            ^^^^ default
//                        ^ symbol.punctuation
  of(1); get(url); from (x);
//^^ default
//       ^^^ default
//                 ^^^^ default
//  ^ symbol.brackets
````

- [ ] **Step 6: Write `test/fixtures/literals.ts` and `test/fixtures/numbers.ts`**

`literals.ts`:

````ts
  n = null; u = undefined; q = NaN;
//    ^^^^ constant
//              ^^^^^^^^^ constant
//                             ^^^ constant
  t = true; f = false; truex = falsey;
//    ^^^^ constant.bool.true
//              ^^^^^ constant.bool.false
//                     ^^^^^ default
//                             ^^^^^^ default
````

`numbers.ts`:

````ts
  x = 1_000 + 1.5 + 1e-3 + 2.5E+10 + 7.;
//    ^^^^^ constant.number
//            ^^^ constant.number
//                  ^^^^ constant.number
//                         ^^^^^^^ constant.number
//                                   ^^ constant.number
  y = .5 + .5e2;
//    ^^ constant.number
//         ^^^^ constant.number
  z = 0xFF_FF + 0b1010 + 0o777 + 10n + 0x1fn;
//    ^^^^^^^ constant.number
//              ^^^^^^ constant.number
//                       ^^^^^ constant.number
//                               ^^^ constant.number
//                                     ^^^^^ constant.number
  w = a1 + b2c + x.y;
//     ^ default
//          ^ default
````

- [ ] **Step 7: Write `test/fixtures/regex.ts`**

````ts
  const r = /ab+c/gi;
//          ^^^^^^^^ constant.string.regex
  const m = s.match(/(\d+)\/x/);
//                  ^^ constant.string.regex
//                    ^^ constant.specialChar
//                        ^^ constant.specialChar
  return /a[/]b/i.test(s);
//       ^^^^^^^^ constant.string.regex
  const q = a / b / c; const r2 = a/b/c;
//            ^^^^^ !constant.string.regex
//                                 ^^^ !constant.string.regex
  const y = arr[i]/n/2; const mid = (w + 1)/2 + (h - 1)/3;
//                ^^^ !constant.string.regex
//                                        ^^^^^^^^^^^^^^ !constant.string.regex
  s.replace(/(\d+)/g, x).split(/,/);
//          ^^ constant.string.regex
//                ^^ constant.string.regex
//                             ^^^ constant.string.regex
  if (/[a-z]/i.test(x) || /b/.test(y)) {}
//    ^^^^^^^^ constant.string.regex
//                        ^^^ constant.string.regex
  if (ok) /re/.test(s);
//        ^^^^ constant.string.regex KNOWN-GAP
  const gt = /a>b/;
//           ^^^^^ constant.string.regex KNOWN-GAP
````

- [ ] **Step 8: Write `test/fixtures/comments.ts`**

````ts
  x = 1; // line comment
//       ^^^^^^^^^^^^^^^ comment
  y = 2; // TODO: fix FIXME XXX
//          ^^^^^ todo
//                    ^^^^^ todo
//                          ^^^ todo
  const re = /\/\//; // after regex
//           ^^^^^^ !comment
//                   ^^^^^^^^ comment
  if (/^\/\//.test(u)) { x = 1; } // real
//                       ^^^^^^ !comment
//                                ^^^^^^^ comment
  url = 'http://x';
//            ^^^ !comment
  /* block TODO
//^^^^^^^^ comment
//         ^^^^ todo
   * @param a doc
// ^^^^^^^^^^^^^^ identifier
   */ z = 3;
// ^^ comment
//    ^ default
````

- [ ] **Step 9: Write `test/fixtures/strings.ts` and `test/fixtures/templates.ts`**

`strings.ts`:

````ts
  a = "double \"esc\" end";
//    ^ constant.quotes
//     ^^^^^^ constant.string
//            ^^ constant.stringEscaped
//                       ^ constant.quotes
  b = 'single \'esc\' end';
//    ^ constant.quotes
//     ^^^^^^ constant.string
//            ^^ constant.stringEscaped
//                       ^ constant.quotes
  c = "unclosed
//     ^^^^^^^^ constant.string
  d = 1;
//    ^ constant.number
  e = 'unclosed
//     ^^^^^^^^ constant.string
  d = 2;
//    ^ constant.number
  <p>don't stop</p>; f = 'x';
//       ^^^^^^ !constant.string
//                        ^ constant.string
  g = '/a' + '/b';
//         ^ !constant.string
  const re = /["]/g; const s = "after regex";
//           ^^^^^^ constant.string.regex
//                              ^^^^^ constant.string
  const re2 = /[']/g; const s2 = 'after regex';
//            ^^^^^^ constant.string.regex
//                                ^^^^^ constant.string
````

`templates.ts`:

````ts
  t = `a ${b} c`;
//    ^ constant.quotes
//     ^^ constant.string
//       ^^^^ constant.tplLiterals.expression
//             ^ constant.quotes
  u = `x ${fn({ a })} y`;
//       ^^^^^^^^^^^^ constant.tplLiterals.expression
  v = `line one
//     ^^^^^^^^ constant.string
    line two ${z}`;
//  ^^^^^^^^ constant.string
//           ^^^^ constant.tplLiterals.expression
  w = `esc \` ${q}`;
//         ^^ constant.stringEscaped
//            ^^^^ constant.tplLiterals.expression
  const re = /[`]/g; const s = `after regex`;
//           ^^^^^^ constant.string.regex
//                              ^^^^^ constant.string
  n = `${a({ b: { c } })}`;
//     ^^^^^^^^^^^^^^^^^^ constant.tplLiterals.expression KNOWN-GAP
````

- [ ] **Step 10: Write `test/fixtures/jsx.tsx`**

````tsx
  const e = <div className="x">hi {y}</div>;
//          ^ symbol.operator
//           ^^^ statement.tag
//               ^^^^^^^^^ identifier.attribute
//                        ^ symbol.operator
//                                   ^^ symbol.operator
//                                     ^^^ statement.tag
//                                ^ symbol.braces
  const c = <Card title="Home" onClick={go} />;
//           ^^^^ type.tag
//                             ^^^^^^^ identifier.attribute
//                                     ^ symbol.braces
  const l = <a.b x={1}></a.b>; const m = <Foo.Bar />;
//           ^^^ statement.tag
//                                        ^^^^^^^ type.tag
  const g: Array<T> = useState<T>(); a < b;
//         ^^^^^^^^ !statement.tag
//                            ^^^ !type.tag
  const b = <button type="button" as={Link}>x</button>;
//                  ^^^^ identifier.attribute
//                                ^^ identifier.attribute
  const f = <>for in</>;
//            ^^^ default KNOWN-GAP
  const t = <p>text<b>x</b></p>;
//                  ^ statement.tag KNOWN-GAP
````

- [ ] **Step 11: Run the fixtures**

Run: `cd test && go test -run TestFixtures -v ./... 2>&1 | grep -E '^(=== RUN|--- |ok|FAIL)'`
Expected: twelve `--- PASS: TestFixtures/<file>` lines and `ok`. A failure prints `file:line: want <group>, got <groups>` with the code line and carets; fix the fixture only if it is a transcription error, never by copying the "got" groups.

- [ ] **Step 12: Check that the fixtures bite**

Temporarily change `constant.string.regex` to `constant.string.regexX` in `typescript-rules.yaml`, run `cd test && go test -run TestFixtures ./...`, and expect failures in `regex.ts`, `comments.ts`, `strings.ts` and `templates.ts`. Then undo the change with `git checkout -- typescript-rules.yaml` (the file is committed after Task 1, so this restores it exactly).

- [ ] **Step 13: Commit**

```bash
git add test/fixtures
git commit -m "test(syntax): add fixtures for every rule section"
```

---

### Task 4: Mutation check, and delete the dead rules it finds

**Files:**
- Create: `test/mutate.go`
- Test: `test/mutate_test.go`
- Modify: `test/fixtures/keywords.ts` (one assertion)
- Modify: `typescript-rules.yaml` (delete five rules)

**Interfaces:**
- Consumes: `Load`, `LoadFixtures`, `Check`, `Defs`, `Fixture`, `root`.
- Produces: `type Mutant struct{ File string; Line int; Desc string; YAML []byte }`; `func Mutants(file string, src []byte) ([]Mutant, error)`; `TestEveryRuleIsCovered`.

- [ ] **Step 1: Write the failing tests**

````go
package syntaxtest

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestMutants(t *testing.T) {
	src := []byte(`filetype: x
rules:
    - include: "y"
    - a: "A"
    - r:
        start: "'"
        end: "'"
        skip: "\\\\."
        rules:
            - b: "B"
    - c: "C"
`)
	ms, err := Mutants("x", src)
	if err != nil {
		t.Fatal(err)
	}
	want := []struct {
		line int
		desc string
		gone string
	}{
		{4, `a: "A"`, `a: "A"`},
		{5, `region r from "'"`, `- r:`},
		{8, `skip of region r from "'"`, `skip:`},
		{10, `b: "B"`, `b: "B"`},
		{11, `c: "C"`, `c: "C"`},
	}
	if len(ms) != len(want) {
		t.Fatalf("got %d mutants: %+v", len(ms), ms)
	}
	for i, w := range want {
		m := ms[i]
		if m.Line != w.line || m.Desc != w.desc {
			t.Errorf("mutant %d: got line %d %q, want line %d %q", i, m.Line, m.Desc, w.line, w.desc)
		}
		if strings.Contains(string(m.YAML), w.gone) {
			t.Errorf("mutant %d still contains %q:\n%s", i, w.gone, m.YAML)
		}
		if !strings.Contains(string(m.YAML), `include: "y"`) {
			t.Errorf("mutant %d lost the include:\n%s", i, m.YAML)
		}
	}
}

// TestEveryRuleIsCovered removes each rule, region and region skip in turn
// and fails if no fixture assertion notices.
func TestEveryRuleIsCovered(t *testing.T) {
	fixtures, err := LoadFixtures("fixtures")
	if err != nil {
		t.Fatal(err)
	}
	defs, err := Load(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, f := range fixtures {
		if len(Check(defs, f)) > 0 {
			t.Fatal("TestFixtures fails; fix it first, or every mutant looks caught")
		}
	}
	var uncovered []string
	for _, name := range []string{"typescript-rules", "jsx-tags"} {
		src, err := os.ReadFile(filepath.Join(root, name+".yaml"))
		if err != nil {
			t.Fatal(err)
		}
		mutants, err := Mutants(name, src)
		if err != nil {
			t.Fatal(err)
		}
		for _, m := range mutants {
			defs, err := Load(root, map[string][]byte{name: m.YAML})
			if err != nil {
				t.Fatalf("%s.yaml:%d %s: %v", name, m.Line, m.Desc, err)
			}
			if !caught(defs, fixtures) {
				uncovered = append(uncovered, fmt.Sprintf("    %s.yaml:%d %s", name, m.Line, m.Desc))
			}
		}
	}
	if len(uncovered) > 0 {
		t.Errorf("no fixture assertion fails without these; add an assertion or delete the rule:\n%s",
			strings.Join(uncovered, "\n"))
	}
}

// caught reports whether any assertion that is not a known gap fails.
func caught(defs Defs, fixtures []*Fixture) bool {
	for _, f := range fixtures {
		for _, e := range Check(defs, f) {
			if !e.Assertion.KnownGap {
				return true
			}
		}
	}
	return false
}
````

- [ ] **Step 2: Run them to see them fail**

Run: `cd test && go test ./...`
Expected: FAIL to compile with `undefined: Mutants`.

- [ ] **Step 3: Write the mutant generator**

````go
package syntaxtest

import (
	"fmt"
	"slices"

	"gopkg.in/yaml.v3"
)

// A Mutant is a rules file with one item removed.
type Mutant struct {
	File string // e.g. "typescript-rules"
	Line int    // YAML line of the removed item
	Desc string // what was removed
	YAML []byte
}

// target addresses an item: indices through nested `rules:` sequences, and
// whether to remove the item's `skip:` key instead of the item.
type target struct {
	path []int
	skip bool
}

// Mutants lists every pattern rule, region and region `skip:` in a rules
// file, each as a copy of the file without it.
func Mutants(file string, src []byte) ([]Mutant, error) {
	var doc yaml.Node
	if err := yaml.Unmarshal(src, &doc); err != nil {
		return nil, err
	}
	var out []Mutant
	add := func(t target, line int, desc string) error {
		data, err := remove(src, t)
		if err != nil {
			return err
		}
		out = append(out, Mutant{file, line, desc, data})
		return nil
	}
	var walk func(seq *yaml.Node, path []int) error
	walk = func(seq *yaml.Node, path []int) error {
		for i, item := range seq.Content {
			key, val := item.Content[0], item.Content[1]
			p := append(slices.Clone(path), i)
			switch {
			case key.Value == "include":
			case val.Kind == yaml.ScalarNode:
				if err := add(target{p, false}, key.Line, fmt.Sprintf("%s: %q", key.Value, val.Value)); err != nil {
					return err
				}
			default:
				start := mapValue(val, "start")
				if err := add(target{p, false}, key.Line, fmt.Sprintf("region %s from %q", key.Value, start.Value)); err != nil {
					return err
				}
				if skip := mapValue(val, "skip"); skip != nil {
					if err := add(target{p, true}, skip.Line, fmt.Sprintf("skip of region %s from %q", key.Value, start.Value)); err != nil {
						return err
					}
				}
				if rules := mapValue(val, "rules"); rules != nil {
					if err := walk(rules, p); err != nil {
						return err
					}
				}
			}
		}
		return nil
	}
	if err := walk(mapValue(doc.Content[0], "rules"), nil); err != nil {
		return nil, err
	}
	return out, nil
}

// remove re-parses src and deletes the target, so every mutant starts from
// an untouched tree.
func remove(src []byte, t target) ([]byte, error) {
	var doc yaml.Node
	if err := yaml.Unmarshal(src, &doc); err != nil {
		return nil, err
	}
	seq := mapValue(doc.Content[0], "rules")
	for depth, i := range t.path {
		if depth < len(t.path)-1 {
			seq = mapValue(seq.Content[i].Content[1], "rules")
			continue
		}
		if t.skip {
			region := seq.Content[i].Content[1]
			for k := 0; k < len(region.Content); k += 2 {
				if region.Content[k].Value == "skip" {
					region.Content = slices.Delete(region.Content, k, k+2)
					break
				}
			}
		} else {
			seq.Content = slices.Delete(seq.Content, i, i+1)
		}
	}
	return yaml.Marshal(&doc)
}

func mapValue(m *yaml.Node, key string) *yaml.Node {
	for k := 0; k+1 < len(m.Content); k += 2 {
		if m.Content[k].Value == key {
			return m.Content[k+1]
		}
	}
	return nil
}
````

- [ ] **Step 4: Run the tests and read the uncovered list**

Run: `cd test && go mod tidy && go test ./...`
Expected: `TestMutants` passes; `TestEveryRuleIsCovered` FAILS with exactly:

```text
no fixture assertion fails without these; add an assertion or delete the rule:
    typescript-rules.yaml:26 symbol.braces: "[{}]"
    typescript-rules.yaml:37 statement.var: "\\bvar\\b"
    typescript-rules.yaml:38 statement.let: "\\blet\\b"
    typescript-rules.yaml:41 statement.function: "\\bfunction\\b"
    typescript-rules.yaml:68 symbol.braces: "[{}]"
    typescript-rules.yaml:86 statement: "\\benum\\b"
```

Why each one is uncovered:
- Line 68 `symbol.braces` is needed: the `default:` label rule just above it paints the `{` in `default: {` as `statement`, and line 68 paints it back. It only lacks an assertion.
- Line 26 `symbol.braces` is dead: line 68 repaints every brace later.
- Lines 37 `statement.var`, 38 `statement.let` and 41 `statement.function` are dead: the late copies (`statement.let`/`statement.var` after the `let`/`var` name reset, and `statement.function: "\\bfunction\\b\\s*\\*?"`) paint every match again.
- Line 86 `statement: "\\benum\\b"` is dead: `enum` is in the second keyword list, which runs after `identifier.const`, and no later rule resets it.

- [ ] **Step 5: Add the missing assertion and delete the dead rules**

In `test/fixtures/keywords.ts`, the code line `    default: {` gets a second assertion line directly under its existing one:

```text
    default: {
//  ^^^^^^^^ statement
//           ^ symbol.braces
```

In `typescript-rules.yaml`, delete these five lines (each is one line; delete from the bottom up so the line numbers stay valid):

```yaml
    - statement: "\\benum\\b"            # line 86
    - statement.function: "\\bfunction\\b"   # line 41
    - statement.let: "\\blet\\b"         # line 38
    - statement.var: "\\bvar\\b"         # line 37
    - symbol.braces: "[{}]"              # line 26
```

(The trailing comments above only identify the lines; the file has no such comments.) Keep the late `statement.function: "\\bfunction\\b\\s*\\*?"`, `statement.let`, `statement.var` and the `symbol.braces` after the `default:` label rule.

The final `test/fixtures/keywords.ts`:

````ts
  abstract class A extends B implements C {}
//^^^^^^^^ statement
//         ^^^^^ statement.class
//                 ^^^^^^^ statement
//                           ^^^^^^^^^^ statement
  async function f() { await g(); }
//^^^^^ statement
//                     ^^^^^ statement
  if (a) {} else {} for (k of o) {} while (x) {} do {}
//^^ statement
//          ^^^^ statement
//                  ^^^ statement
//                         ^^ statement
//                                  ^^^^^ statement
//                                               ^^ statement
  try {} catch (e) {} finally {} debugger;
//^^^ statement
//       ^^^^^ statement
//                    ^^^^^^^ statement
//                               ^^^^^^^^ statement
  switch (k) { case 1: break; }
//^^^^^^ statement
//             ^^^^ statement
//                     ^^^^^ statement
  switch (k) {
    default:
//  ^^^^^^^^ statement
      continue;
//    ^^^^^^^^ statement
    default: {
//  ^^^^^^^^ statement
//           ^ symbol.braces
    default: return;
//  ^^^^^^^^ statement
  }
  export default x;
//^^^^^^ statement
//       ^^^^^^^ statement
  import { a } from 'b';
//^^^^^^ statement
//             ^^^^ statement
  return new X(); throw e; delete o.p; typeof x; void 0; yield v;
//^^^^^^ statement
//       ^^^ statement
//                ^^^^^ statement
//                         ^^^^^^ statement
//                                     ^^^^^^ statement
//                                               ^^^^ statement
//                                                       ^^^^^ statement
  x instanceof Y; k in o; x as T; x satisfies T;
//  ^^^^^^^^^^ statement
//                  ^^ statement
//                          ^^ statement
//                                  ^^^^^^^^^ statement
  declare module 'm'; namespace N {} interface I {} enum E {}
//^^^^^^^ statement
//        ^^^^^^ statement
//                    ^^^^^^^^^ statement
//                                   ^^^^^^^^^ statement
//                                                  ^^^^ statement
  const enum Dir {}
//^^^^^ statement.const
//      ^^^^ statement
  public private protected readonly static override accessor
//^^^^^^ statement
//       ^^^^^^^ statement
//               ^^^^^^^^^ statement
//                         ^^^^^^^^ statement
//                                  ^^^^^^ statement
//                                         ^^^^^^^^ statement
//                                                  ^^^^^^^^ statement
  keyof T; infer U; asserts x is string; unique symbol;
//^^^^^ statement
//         ^^^^^ statement
//                  ^^^^^^^ statement
//                            ^^ statement
//                                       ^^^^^^ statement
  var a; let b; type T = U;
//^^^ statement.var
//       ^^^ statement.let
//              ^^^^ statement.const
  get x() {} set y(v) {} super.m(); this.n; with (o) {} using r = s;
//^^^ statement
//           ^^^ statement
//                       ^^^^^ statement
//                                  ^^^^ statement
//                                          ^^^^ statement
//                                                      ^^^^^ statement
  package p; constructor() {} require('x');
//^^^^^^^ statement
//           ^^^^^^^^^^^ statement
//                            ^^^^^^^ statement
````

- [ ] **Step 6: Run everything, then prove the "fix it first" guard**

Run: `cd test && go test ./...`
Expected: `ok`.

Then break one fixture on purpose: change `//  ^^^^^^ statement` under `  switch (k) { case 1: break; }` in `keywords.ts` to `//  ^^^^^^ statement.class`, run `go test -run TestEveryRuleIsCovered ./...`, and expect `TestFixtures fails; fix it first, or every mutant looks caught`. Revert the change and rerun: `ok`.

- [ ] **Step 7: Check the samples render the same**

The deletions must not change any colour. Save this temporary program as
`test/cmd/samecolours/main.go`:

````go
// Command samecolours checks that the samples get the same groups with the
// rules file given as the first argument as with the current rules.
// Temporary: delete this directory after use.
package main

import (
	"fmt"
	"os"
	"reflect"
	"strings"

	syntaxtest "github.com/jv-k/micro-typescript-syntax/test"
)

func main() {
	old, err := os.ReadFile(os.Args[1])
	if err != nil {
		panic(err)
	}
	before, err := syntaxtest.Load("..", map[string][]byte{"typescript-rules": old})
	if err != nil {
		panic(err)
	}
	after, err := syntaxtest.Load("..", nil)
	if err != nil {
		panic(err)
	}
	for _, p := range []string{"../sample.ts", "../sample.tsx", "../dev/sample/demo.ts", "../dev/sample/demo.tsx"} {
		src, err := os.ReadFile(p)
		if err != nil {
			panic(err)
		}
		ft := "typescript"
		if strings.HasSuffix(p, ".tsx") {
			ft = "tsx"
		}
		same := reflect.DeepEqual(syntaxtest.Groups(before[ft], string(src)), syntaxtest.Groups(after[ft], string(src)))
		fmt.Println(p, "same:", same)
	}
}
````

Run from `test/`:

```bash
git show HEAD:typescript-rules.yaml > rules-before.yaml
go run ./cmd/samecolours rules-before.yaml
rm -r cmd/samecolours rules-before.yaml
```

Expected: four lines, each ending `same: true`. Do not commit the program.

- [ ] **Step 8: Commit**

```bash
git add test/mutate.go test/mutate_test.go test/go.mod test/go.sum test/fixtures/keywords.ts
git commit -m "test(syntax): fail when a rule has no assertion that depends on it"
git add typescript-rules.yaml
git commit -m "fix(syntax): delete five rules that later rules repaint"
```

---

### Task 5: `pnpm test`, CI, and contributor docs

**Files:**
- Modify: `package.json`
- Create: `.github/workflows/test.yml`
- Modify: `.gitattributes`
- Modify: `CONTRIBUTING.md` (Files table; new "Test the rules" section after "Change the rules")

**Interfaces:**
- Consumes: the `test/` module from Tasks 1–4.
- Produces: `pnpm test`; a `test` workflow on push and pull request.

- [ ] **Step 1: Add the script**

In `package.json`, add `"test": "cd test && go test ./..."` to `scripts`, so the block reads:

```json
  "scripts": {
    "bump-release": "bash scripts/bump-release.sh",
    "screenshots": "./dev/screenshots.sh",
    "test": "cd test && go test ./..."
  }
```

Run: `pnpm test`
Expected: `ok  github.com/jv-k/micro-typescript-syntax/test`.

- [ ] **Step 2: Add the workflow**

`.github/workflows/test.yml`:

```yaml
name: test

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-go@v7
        with:
          go-version-file: test/go.mod
          cache-dependency-path: test/go.sum
      - name: Fixtures and rule coverage
        working-directory: test
        run: go test ./...
```

Check the syntax locally: `ruby -ryaml -e 'YAML.load_file(".github/workflows/test.yml")' && echo valid` → `valid`.

- [ ] **Step 3: Keep fixtures LF and the tests out of archives**

Append to `.gitattributes`:

```text
test/ export-ignore
docs/ export-ignore
test/fixtures/** text eol=lf
```

- [ ] **Step 4: Document the tests in CONTRIBUTING**

Add two rows to the `## Files` table, after the `dev/` row:

```markdown
| `test/` | The tests for the rules. They use the highlighter from micro. |
| `test/fixtures/` | Test files. Each file has the expected colours below the code. |
```

Add this section after `## Change the rules` (before `## Update the screenshots`):

````markdown
## Test the rules

Run the tests after each change to a rule:

```sh
pnpm test
```

The tests need Go. They use the highlighter from micro v2.0.15, so they do not
start micro.

### Test files

Each file in `test/fixtures/` contains code lines. Below a code line, a test
line gives the expected colour group of some characters:

```ts
  const r = /ab+c/g;
//          ^^^^^^^ constant.string.regex
```

- The `^` characters mark the columns to test. Put two spaces at the start of
  each code line, because `//` uses the first two columns.
- `!group` means that the columns must not have the group.
- `default` means that the columns have no colour.
- `KNOWN-GAP` marks a test that fails at the moment. Use it for each example
  in the README "Edge cases" list. If a change makes a `KNOWN-GAP` test pass,
  the tests fail. Then remove `KNOWN-GAP` and remove the edge case from the
  README.

Use spaces, not tabs. Use LF line endings.

### Each rule needs a test

The tests also remove each rule in turn. If no test fails without a rule, the
tests fail and show the rule. Then do one of these:

- Add a test that needs the rule.
- Delete the rule, if a different rule already does its work.
````

- [ ] **Step 5: Commit**

```bash
git add package.json .github/workflows/test.yml .gitattributes CONTRIBUTING.md
git commit -m "ci: run the rule tests on push and pull request"
```

---

### Task 6: Gap report

**Files:**
- Create: `test/cmd/dump/main.go`
- Create: `test/gaps/corpus.json`, `test/gaps/fetch.mjs`, `test/gaps/report.mjs`
- Create: `test/gaps/REPORT.md` (generated, committed)
- Modify: `package.json` (script and devDependency), `pnpm-lock.yaml`, `.gitignore`

**Interfaces:**
- Consumes: `syntaxtest.Load`, `syntaxtest.Groups`.
- Produces: `go run ./cmd/dump [-root ..] FILE...` printing `{"<path>": [["group", ...], ...]}`; `pnpm gaps` writing `test/gaps/REPORT.md`.

- [ ] **Step 1: Write the dump command**

````go
// Command dump prints micro's group for every character of each file as
// JSON: {"path": [["group", ...], ...]} with one array per line. A file
// ending in .tsx uses the tsx definition; anything else uses typescript.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"

	syntaxtest "github.com/jv-k/micro-typescript-syntax/test"
)

func main() {
	root := flag.String("root", "..", "directory holding the syntax files")
	flag.Parse()
	defs, err := syntaxtest.Load(*root, nil)
	if err != nil {
		fmt.Fprintln(os.Stderr, "dump:", err)
		os.Exit(1)
	}
	out := map[string][][]string{}
	for _, path := range flag.Args() {
		src, err := os.ReadFile(path)
		if err != nil {
			fmt.Fprintln(os.Stderr, "dump:", err)
			os.Exit(1)
		}
		ft := "typescript"
		if strings.HasSuffix(path, ".tsx") {
			ft = "tsx"
		}
		out[path] = syntaxtest.Groups(defs[ft], string(src))
	}
	if err := json.NewEncoder(os.Stdout).Encode(out); err != nil {
		fmt.Fprintln(os.Stderr, "dump:", err)
		os.Exit(1)
	}
}
````

Run: `cd test && go run ./cmd/dump ../sample.ts | head -c 120`
Expected: starts with `{"../sample.ts":[[` followed by group strings.

- [ ] **Step 2: Pin the corpus**

`test/gaps/corpus.json`:

````json
[
  {
    "repo": "microsoft/TypeScript",
    "sha": "dca8e236a227e37183dcf1dd4e51b22571f5b558",
    "paths": ["packages/typescript/src/ast/scanner.ts"]
  },
  {
    "repo": "colinhacks/zod",
    "sha": "0b216ef674e297ebe41d8bf902262e56f8755822",
    "paths": ["packages/zod/src/v4/core/checks.ts"]
  },
  {
    "repo": "shadcn-ui/ui",
    "sha": "295a1f114a138f23b5dfee0e0c6812394dfeb90c",
    "paths": [
      "apps/v4/registry/new-york-v4/ui/button.tsx",
      "apps/v4/registry/new-york-v4/ui/calendar.tsx",
      "apps/v4/registry/new-york-v4/ui/chart.tsx",
      "apps/v4/registry/new-york-v4/ui/command.tsx",
      "apps/v4/registry/new-york-v4/ui/dialog.tsx",
      "apps/v4/registry/new-york-v4/ui/form.tsx",
      "apps/v4/registry/new-york-v4/ui/select.tsx",
      "apps/v4/registry/new-york-v4/ui/sidebar.tsx"
    ]
  },
  {
    "repo": "vercel/next.js",
    "sha": "4868b9926dd7e6c779aff4e57550184f22f4eda2",
    "paths": [
      "examples/blog-starter/src/app/_components/post-preview.tsx",
      "examples/blog-starter/src/app/_components/theme-switcher.tsx",
      "examples/blog-starter/src/app/posts/[slug]/page.tsx",
      "examples/blog-starter/src/lib/api.ts"
    ]
  }
]
````

- [ ] **Step 3: Write the fetcher**

`test/gaps/fetch.mjs`:

````js
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
````

Append to `.gitignore`:

```text

# Gap report corpus (pnpm gaps downloads it)
test/gaps/.corpus/
```

- [ ] **Step 4: Fetch the corpus**

Run: `node test/gaps/fetch.mjs && find test/gaps/.corpus -type f | xargs wc -l | tail -1`
Expected: fourteen `fetched …` lines, then `6133 total`. Run it again: no output (all cached). `git status --short` shows no `.corpus` paths.

- [ ] **Step 5: Check a bad pin fails cleanly**

```bash
printf '[{"repo":"vercel/next.js","sha":"0000000000000000000000000000000000000000","paths":["nope.ts"]}]' > /tmp/bad-corpus.json
CORPUS=/tmp/bad-corpus.json node test/gaps/fetch.mjs; echo "exit $?"
ls test/gaps/.corpus/vercel/next.js/nope.ts
rm /tmp/bad-corpus.json
```

Expected: `Error: fetch https://raw.githubusercontent.com/vercel/next.js/0000…/nope.ts: 404`, `exit 1`, and `ls` reports no such file.

- [ ] **Step 6: Add TypeScript and the script**

```bash
pnpm add -D --save-exact typescript@6.0.3
```

Add `"gaps": "node test/gaps/fetch.mjs && node test/gaps/report.mjs"` to `scripts` in `package.json`.

- [ ] **Step 7: Write the report**

`test/gaps/report.mjs`:

````js
// report.mjs: compare micro's highlighting of the corpus with TypeScript's
// syntactic classifier, character by character, and write REPORT.md.
// Run fetch.mjs first. Usage: node test/gaps/report.mjs
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const testDir = join(here, '..');
const corpusDir = join(here, '.corpus');
const corpus = JSON.parse(await readFile(join(here, 'corpus.json'), 'utf8'));
const files = corpus.flatMap(({ repo, paths }) => paths.map((p) => join(corpusDir, repo, p)));

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
  execFileSync('go', ['run', './cmd/dump', '-root', '..', ...files], { cwd: testDir, maxBuffer: 1 << 28 }),
);
const rows = new Map();
const totals = { ok: 0, wrong: 0, missing: 0, skippedLines: 0 };
for (const path of files) {
  const text = await readFile(path, 'utf8');
  const { cls, inTemplate } = classify(path, text);
  const name = relative(corpusDir, path);
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
````

- [ ] **Step 8: Run it**

Run: `pnpm gaps`
Expected (rules as after Task 4): `agreement 94.7%: wrong 789, missing 8106; wrote test/gaps/REPORT.md`. The top rows of `REPORT.md`:

```text
## Wrong colour
### 294 · identifier → statement
### 253 · typeReference → statement
### 91 · identifier → constant.string
### 70 · identifier → type.types
…
## Missing colour
### 6355 · typeReference → (none)
### 1541 · interfaceName → (none)
### 149 · typeParameterName → (none)
### 45 · jsxAttribute → (none)
```

Small differences in the counts are acceptable only if the corpus or rules differ from the pins; with the pins above the numbers are exact.

- [ ] **Step 9: Commit**

```bash
git add test/cmd/dump/main.go test/gaps/corpus.json test/gaps/fetch.mjs test/gaps/report.mjs test/gaps/REPORT.md package.json pnpm-lock.yaml .gitignore
git commit -m "test(syntax): report gaps against TypeScript's classifier"
```

---

### Task 7: Choose the gaps to close

**Files:** none until the user chooses.

The spec makes the user pick which gaps to close. Present `test/gaps/REPORT.md`
and these candidates, largest first, then write a follow-up plan for the chosen
ones. Each fix goes test-first: a fixture assertion that fails, the rule
change, `pnpm test` green (mutation check included), and `pnpm gaps` showing
the row shrank with no new wrong-colour rows.

| # | Gap (report rows) | Chars | First idea | Risk |
|---|---|---|---|---|
| a | User type names in type positions: `: Foo`, `<Foo>`, `as Foo`, `extends`/`implements Foo` (typeReference → none) | 6355 | `type` for a capitalised name after `:`/`as`/`extends`/`implements`/`<` in type contexts | High: `a ? b : C` and `{ k: Value }` are not types |
| b | Declared names: `interface X`, `class X`, `type X =`, `enum X`, `namespace X`, `<T>` in a declaration (interfaceName, typeParameterName, moduleName → none) | 1696 | `type` for the name after those keywords | Low |
| c | Keyword-named object keys: `super:`, `this:`, `void:`, `null:`, `any:`, `const:` (identifier → statement, constant, type.types) | ≈380 | Extend the key reset list | Low |
| d | Keywords inside `$` names: `$constructor` (typeReference → statement) | 253 | Reset `\$[A-Za-z0-9_$]+` after the keyword rules | Low |
| e | Multi-line `${…}` in template literals (identifier/keyword → constant.string) | 115 | Make `${` … `}` a nested region that includes the TypeScript rules | Medium: nested braces end early |
| f | JSX boolean attributes: `<X asChild>` (jsxAttribute → none) | 45 | `identifier.attribute` for a bare name inside a tag | Medium: JSX text |
| g | `type` used as a variable: `return type;` (identifier → statement.const) | 17 | Keyword only when followed by a name and `=` or `<` | Low |

Ask with AskUserQuestion (multi-select), recommending b, c, d and g first: low risk, and together about 2.3k characters.
