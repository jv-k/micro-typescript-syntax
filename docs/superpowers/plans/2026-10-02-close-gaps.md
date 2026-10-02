# Close Low-Risk Highlight Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close gaps b, c, d and g from `test/gaps/REPORT.md`: declared type names, keyword-named keys, keywords inside `$` names, and `type` used as a variable.

**Architecture:** Each gap is a rule change in `typescript-rules.yaml`, made test-first: fixture assertions that fail, the rule change, `go test` green (fixtures and the rule-coverage mutation check), then `pnpm gaps` to confirm the report rows shrink with no new wrong-colour rows. A first task fixes a mapping error in the gap report so the key fix is measured correctly.

**Tech Stack:** micro syntax YAML (Go RE2 regexes), the Go test harness in `test/`, Node 26 with `typescript` 6.0.3 for the report.

**Spec:** `docs/superpowers/specs/2026-10-02-highlight-tests-design.md` (§5 Gap fixes). Gaps chosen by the user from the first plan's Task 7: b, c, d, g.

Every step below was replayed on a scratch clone of `master` (68d1b1f) while
writing the plan. The failure counts, coverage results and report numbers are
the observed ones.

## Global Constraints

- Micro applies patterns in file order, each painting over the ones before; regions (strings, comments) beat patterns. Where a rule goes is part of the fix: keep each insertion exactly where the step puts it.
- RE2 has no lookbehind or lookahead. A rule that consumes a neighbouring character must be followed by rules that repaint that character.
- Fixture rules from CONTRIBUTING: two-space indented code lines, LF, no tabs, `KNOWN-GAP` only for README edge cases.
- `go test ./...` in `test/` includes `TestEveryRuleIsCovered`: every new rule needs an assertion that fails without it, and a rule made dead by a change is deleted.
- Commit `test/gaps/REPORT.md` together with each rule change (CONTRIBUTING). Commits: Conventional Commits with scope; stage explicit paths.
- Work on a branch, not `master`: `git switch -c feat/close-gaps`.

## Review Focus

- A ternary or `case` that uses a literal or keyword before `:` (`a ? null : b`, `case null:`, `x ? this : y`): the key reset must not touch it. Pinned in Task 4 (assertions on `ok ? null : this; f(a, b ? true : false);` and `case null:`).
- A `$`-prefixed variable that is not a keyword (`const $el = 1`): it must keep `identifier.const`. Pinned in Task 5 (`$el` assertion).
- `type` as a statement keyword in its other forms (`export type { A }`, `import type B`, `type T = U`): the variable reset must not touch them. Pinned in Task 3.
- Words that start with a declaration keyword (`className`, `classes`, `interfaces`): no type colour. Pinned in Task 2.
- Colour changes outside the gaps in real files: the sample and demo files may change only on declaration lines. Pinned in Task 6 (sample comparison with an exact expected list).

---

### Task 1: Report keeps `undefined` and `NaN` keys as names

**Files:**
- Modify: `test/gaps/report.mjs` (the `visit` function in `classify`)
- Modify: `test/gaps/REPORT.md` (regenerated)

**Interfaces:**
- Produces: a report baseline for Tasks 2–5: `agreement 94.7%: wrong 798, missing 8106`.

The report maps every `undefined`/`NaN` identifier to "should be `constant`".
For a key such as `undefined: SyntaxKind.UndefinedKeyword` that is wrong: the
key is a plain name. Without this fix, Task 4's correct key reset would show up
as 9 characters of new "missing colour".

- [x] **Step 1: Change the mapping**

````diff
@@ -51,4 +51,8 @@ function classify(path, text) {
   const visit = (node) => {
     if (node.kind === ts.SyntaxKind.RegularExpressionLiteral) mark(node, 'regex');
+    else if (ts.isIdentifier(node) && ts.isPropertyAssignment(node.parent) && node.parent.name === node) {
+      // a key named `undefined` or `NaN` is a plain name, not the value
+      if (node.text === 'undefined' || node.text === 'NaN') mark(node, 'identifier');
+    }
     else if (ts.isTypeReferenceNode(node)) {
       // `as const` parses as a reference to a type named `const`
````

- [x] **Step 2: Regenerate the report**

Run: `pnpm gaps`
Expected: `agreement 94.7%: wrong 798, missing 8106; wrote test/gaps/REPORT.md`. The row `identifier → constant` grows from 4 to 13: master colours these keys as constants, and the report now counts that as wrong.

- [x] **Step 3: Commit**

```bash
git add test/gaps/report.mjs test/gaps/REPORT.md
git commit -m "fix(test): count undefined and NaN keys as names in the gap report"
```

---

### Task 2: Declared type names (gap b)

**Files:**
- Create: `test/fixtures/declared-types.ts`
- Modify: `typescript-rules.yaml` (insert before the first `symbol.brackets` rule, after the arrow-function `default` rule)
- Modify: `test/gaps/REPORT.md`

**Interfaces:**
- Consumes: the Task 1 report baseline.
- Produces: three `type` rules ahead of the symbol rules. Task 3 relies on the symbol rules after them still repainting `<`, `>`, `,`, `=`.

- [x] **Step 1: Write the failing fixture**

`test/fixtures/declared-types.ts`:

````ts
  // Declared type names and type parameters get the type colour.
  class Foo<T> extends Bar {}
//^^^^^ statement.class
//      ^^^ type
//         ^ symbol.operator
//          ^ type
//             ^^^^^^^ statement
  interface Props<T, U extends K> { a: T }
//^^^^^^^^^ statement
//          ^^^^^ type
//                ^ type
//                 ^ symbol.punctuation
//                   ^ type
//                     ^^^^^^^ statement
  type Handler<E> = (e: E) => void;
//^^^^ statement.const
//     ^^^^^^^ type
//             ^ type
//                ^ symbol.operator
  enum Dir { Up } const enum Mode {}
//^^^^ statement
//     ^^^ type
//                ^^^^^ statement.const
//                           ^^^^ type
  declare namespace NS {}
//        ^^^^^^^^^ statement
//                  ^^ type
  function id<T>(x: T): T { return x; }
//^^^^^^^^ statement.function
//         ^^ identifier.function
//           ^ symbol.operator
//            ^ type
  const C = class extends Base {};
//          ^^^^^ statement.class
//                ^^^^^^^ statement
  className; classes; interfaces;
//^^^^^^^^^ default
//           ^^^^^^^ default
````

- [x] **Step 2: Run it to see it fail**

Run: `cd test && go test -run TestFixtures ./... 2>&1 | grep -c 'want '`
Expected: `11` (every `type` assertion; the keyword, operator and `className` assertions already hold).

- [x] **Step 3: Add the rules**

The rules paint each whole declaration as `type`. The symbol rules and keyword rules that come after them repaint everything except the names, and the late `identifier.function` rule repaints a function's own name.

````diff
@@ -23,4 +23,12 @@ rules:
     - default: "((\\s*\\??:\\s*([^=;,<]|<([^<>]|<[^<>]*>)*>)+?)?\\s*=|\\s*\\??:)\\s*(async\\s*)?(<[^<>]*>\\s*)?(\\([^()]*\\)|[A-Za-z_$][A-Za-z0-9_$]*)(\\s*:\\s*[^=;]+?)?\\s*=>"
 
+    # Declared type names and their type parameters: `class A<T>`,
+    # `interface P`, `type X<T> =`, `enum E`, `namespace N`, `function f<T>`.
+    # Paint the declaration; the symbol and keyword rules below repaint all
+    # but the names. A function's own name is repainted further down.
+    - type: "\\b(class|enum|interface|namespace)\\s+[A-Za-z_$][A-Za-z0-9_$]*(\\s*<([^<>]|<[^<>]*>)*>)?"
+    - type: "\\btype\\s+[A-Za-z_$][A-Za-z0-9_$]*\\s*(<([^<>]|<[^<>]*>)*>\\s*)?="
+    - type: "\\bfunction\\b\\s*\\*?\\s*[A-Za-z_$][A-Za-z0-9_$]*\\s*<([^<>]|<[^<>]*>)*>"
+
     - symbol.brackets: "[(){}]|\\[|\\]"
     - symbol.operator: "[-+/*=<>!~%?:&|^]"
````

- [x] **Step 4: Run all tests**

Run: `cd test && go test ./...`
Expected: `ok` (fixtures and rule coverage).

- [x] **Step 5: Measure**

Run: `pnpm gaps`
Expected: `agreement 96.0%: wrong 798, missing 5914`. The `interfaceName → (none)` row is gone and `typeParameterName → (none)` drops from 149 to 38 (the rest are method signatures such as `lookAhead<T>(…)`, which this gap does not cover).

- [x] **Step 6: Commit**

```bash
git add test/fixtures/declared-types.ts typescript-rules.yaml test/gaps/REPORT.md
git commit -m "feat(syntax): colour declared type names and type parameters"
```

---

### Task 3: `type` as a variable (gap g)

**Files:**
- Modify: `test/fixtures/keywords-as-names.ts` (append)
- Modify: `typescript-rules.yaml` (keyword-as-name block; delete one early rule)
- Modify: `test/gaps/REPORT.md`

**Interfaces:**
- Consumes: Task 2's rules (unchanged here).
- Produces: widened repaint rules after the keyword-as-name resets: `symbol.brackets: "[()\\]]"`, `symbol.punctuation: "[.,;]"`, `symbol.operator: "[?:=!]"`. Task 4 inserts its block after these.

- [x] **Step 1: Write the failing assertions**

Append to `test/fixtures/keywords-as-names.ts`:

````ts
  // `type` as a variable is a plain name.
  return type; if (type === x) {} f(type, type); type = 1; x = [type];
//       ^^^^ default
//                 ^^^^ default
//                                  ^^^^ default
//                                        ^^^^ default
//                                               ^^^^ default
//                                                              ^^^^ default
//           ^ symbol.punctuation
//                      ^^^ symbol.operator
//                           ^ symbol.brackets
//                                                                  ^ symbol.brackets
  export type { A }; import type B from 'b'; type T = U;
//       ^^^^ statement.const
//                          ^^^^ statement.const
//                                           ^^^^ statement.const
````

- [x] **Step 2: Run them to see them fail**

Run: `cd test && go test -run TestFixtures ./... 2>&1 | grep -c 'want '`
Expected: `6` (each `type` used as a variable is `statement.const`).

- [x] **Step 3: Reset `type` before `;`, `,`, `)`, `]`, `}`, `==`/`===`/`!=`, a lone `=`, or the line end, and widen the repaints**

The reset consumes the next character, so the three repaint rules after it now cover `)`, `]`, `,`, `;`, `=` and `!` as well. They repaint symbols that are always these groups at this point in the file.

````diff
@@ -63,7 +62,9 @@ rules:
     - default: "\\b(abstract|accessor|as|asserts|async|constructor|declare|from|get|infer|is|keyof|module|namespace|of|override|package|readonly|require|satisfies|set|type|unique|using)\\s*\\."
     - default: "\\b(declare|from|get|is|module|namespace|of|set|type|using)\\s*\\("
-    - symbol.brackets: "\\("
-    - symbol.punctuation: "\\."
-    - symbol.operator: "[?:]"
+    # `type` as a variable: `return type;`, `type === x`, `f(type)`, `type = 1`
+    - default: "\\btype\\s*([;,)\\]}]|[=!]==?|=[^=>]|$)"
+    - symbol.brackets: "[()\\]]"
+    - symbol.punctuation: "[.,;]"
+    - symbol.operator: "[?:=!]"
 
     # `default:` is a switch label when the line ends after it, opens a
````

Leave the early `symbol.punctuation: "[.,;]"` (just after `symbol.operator: "[-+/*=<>!~%?:&|^]"`) in place for now.

- [x] **Step 4: Run all tests and read the coverage failure**

Run: `cd test && go test ./...`
Expected: fixtures pass; `TestEveryRuleIsCovered` FAILS with exactly:

```text
    typescript-rules.yaml:35 symbol.punctuation: "[.,;]"
```

The widened `symbol.punctuation: "[.,;]"` in the keyword-as-name block repaints every `.`, `,` and `;`, and nothing between the two rules paints those characters, so the early rule is dead.

- [x] **Step 5: Delete the dead rule**

````diff
@@ -33,5 +33,4 @@ rules:
     - symbol.brackets: "[(){}]|\\[|\\]"
     - symbol.operator: "[-+/*=<>!~%?:&|^]"
-    - symbol.punctuation: "[.,;]"
 
     # ─── Keywords and types ──────────────────────────────────────────────────
````

Run: `cd test && go test ./...`
Expected: `ok`.

- [x] **Step 6: Measure**

Run: `pnpm gaps`
Expected: `agreement 96.0%: wrong 786, missing 5914`. The `identifier → statement.const` row is gone.

- [x] **Step 7: Commit**

```bash
git add test/fixtures/keywords-as-names.ts typescript-rules.yaml test/gaps/REPORT.md
git commit -m "fix(syntax): show type as a plain name when it is a variable"
```

---

### Task 4: Keyword-named keys (gap c)

**Files:**
- Modify: `test/fixtures/keywords-as-names.ts` (append)
- Modify: `typescript-rules.yaml` (new block before `# ─── Regex literals`; move the `default:` label rule after it)
- Modify: `test/gaps/REPORT.md`

**Interfaces:**
- Consumes: Task 3's repaint rules (earlier in the file; unchanged).
- Produces: the block `# ─── Keywords used as plain names, again`, followed by the moved `default:` label rule and `symbol.braces`. Task 5 inserts its rule between them.

- [x] **Step 1: Write the failing assertions**

Append to `test/fixtures/keywords-as-names.ts`:

````ts
  // Keyword-named keys stay plain names; ternaries keep their colours.
  x = { super: 1, this: 2, void: 3 };
//      ^^^^^ default
//                ^^^^ default
//                         ^^^^ default
//              ^ symbol.punctuation
//                    ^ symbol.operator
  y = { null: 1, true: 2, undefined: 3, NaN: 4 };
//      ^^^^ default
//               ^^^^ default
//                        ^^^^^^^^^ default
//                                      ^^^ default
  z = { any: 1, string?: 2, const: 3, let: 4, var: 5, function: 6 };
//      ^^^ default
//              ^^^^^^ default
//                    ^ symbol.operator
//                          ^^^^^ default
//                                    ^^^ default
//                                            ^^^ default
//                                                    ^^^^^^^^ default
    null: SyntaxKind.NullKeyword,
//  ^^^^ default
  ok ? null : this; f(a, b ? true : false);
//     ^^^^ constant
//            ^^^^ statement
//                           ^^^^ constant.bool.true
//                                  ^^^^^ constant.bool.false
  switch (k) { case null: break; }
//                  ^^^^ constant
````

- [x] **Step 2: Run them to see them fail**

Run: `cd test && go test -run TestFixtures ./... 2>&1 | grep -c 'want '`
Expected: `14`. The ternary and `case null:` assertions already hold; they guard against the fix going too far.

- [x] **Step 3: Add the late key reset and move the label rule after it**

Literals (`null`, `true`, …), type keywords (`any`, `string`, …) and the late `const`/`let`/`var`/`function` rules run after the existing key reset, so they paint these keys again. The new reset runs after all of them. It needs `{`, `,` or the line start before the key so that ternaries and `case` labels keep their colours. The `default:` label rule moves below it because the new `[?:]` repaint would otherwise recolour the label's colon; no rule between the old and new positions touches `default:`.

````diff
@@ -68,9 +68,4 @@ rules:
     - symbol.operator: "[?:=!]"
 
-    # `default:` is a switch label when the line ends after it, opens a
-    # block, or jumps; otherwise it's an object key, reset above.
-    - statement: "\\bdefault\\s*:(\\s*$|\\s*\\{\\s*$|\\s*(break|return|throw|continue)\\b)"
-    - symbol.braces: "[{}]"
-
     # ─── Literals ────────────────────────────────────────────────────────────
     - constant: "\\b(null|undefined|NaN)\\b"
@@ -95,4 +90,18 @@ rules:
     - statement.var: "\\bvar\\b"
 
+    # ─── Keywords used as plain names, again ────────────────────────────────
+    # The literal, type-keyword and late keyword rules above repaint keys
+    # such as `null:`, `any:` or `const:`. Reset those keys again, but only
+    # after `{`, `,` or at the start of a line, so `a ? null : b` and
+    # `case null:` keep their colours.
+    - default: "(^|[{,])\\s*(any|bigint|boolean|const|false|function|let|NaN|never|null|number|object|string|super|symbol|this|true|undefined|unknown|var|void)\\??\\s*:"
+    - symbol.punctuation: ","
+    - symbol.operator: "[?:]"
+
+    # `default:` is a switch label when the line ends after it, opens a
+    # block, or jumps; otherwise it's an object key, reset above.
+    - statement: "\\bdefault\\s*:(\\s*$|\\s*\\{\\s*$|\\s*(break|return|throw|continue)\\b)"
+    - symbol.braces: "[{}]"
+
     # ─── Regex literals ──────────────────────────────────────────────────────
     # A `/` is a regex, not division, when no word character touches it
````

- [x] **Step 4: Run all tests**

Run: `cd test && go test ./...`
Expected: `ok`.

- [x] **Step 5: Measure**

Run: `pnpm gaps`
Expected: `agreement 96.1%: wrong 662, missing 5914`. The rows `identifier → type.types`, `identifier → statement.let`, `→ statement.var`, `→ statement.function`, `→ constant.bool.*` and `→ constant` are gone.

- [x] **Step 6: Commit**

```bash
git add test/fixtures/keywords-as-names.ts typescript-rules.yaml test/gaps/REPORT.md
git commit -m "fix(syntax): show keyword-named keys such as null: and const: as plain names"
```

---

### Task 5: Keywords inside `$` names (gap d)

**Files:**
- Modify: `test/fixtures/keywords-as-names.ts` (append)
- Modify: `typescript-rules.yaml` (insert between Task 4's block and the `default:` label rule)
- Modify: `test/gaps/REPORT.md`

**Interfaces:**
- Consumes: Task 4's block position.

- [x] **Step 1: Write the failing assertions**

Append to `test/fixtures/keywords-as-names.ts`:

````ts
  // A keyword inside a name with `$` is not a keyword.
  core.$constructor<Z>(x); y = $type + $if + type$ + $null;
//     ^^^^^^^^^^^^ default
//                             ^^^^^ default
//                                     ^^^ default
//                                           ^^^^^ default
//                                                   ^^^^^ default
  const $el = 1; const $type = 2;
//      ^^^ identifier.const
//               ^^^^^ statement.const
````

- [x] **Step 2: Run them to see them fail**

Run: `cd test && go test -run TestFixtures ./... 2>&1 | grep -c 'want '`
Expected: `5`. The `$el` and second `const` assertions already hold.

- [x] **Step 3: Reset a keyword joined to `$`**

The word list is every word a keyword, type-keyword or literal rule paints. It goes after the other resets so nothing repaints these names.

````diff
@@ -99,4 +99,8 @@ rules:
     - symbol.operator: "[?:]"
 
+    # `$` is not a word character, so `\b` finds keywords inside names such
+    # as `$constructor` or `type$`. Those names are plain.
+    - default: "\\$+(abstract|accessor|any|as|asserts|async|await|bigint|boolean|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|infer|instanceof|interface|is|keyof|let|module|namespace|NaN|never|new|null|number|object|of|override|package|private|protected|public|readonly|require|return|satisfies|set|static|string|super|switch|symbol|this|throw|true|try|type|typeof|undefined|unique|unknown|using|var|void|while|with|yield)\\b|\\b(abstract|accessor|any|as|asserts|async|await|bigint|boolean|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|infer|instanceof|interface|is|keyof|let|module|namespace|NaN|never|new|null|number|object|of|override|package|private|protected|public|readonly|require|return|satisfies|set|static|string|super|switch|symbol|this|throw|true|try|type|typeof|undefined|unique|unknown|using|var|void|while|with|yield)\\$"
+
     # `default:` is a switch label when the line ends after it, opens a
     # block, or jumps; otherwise it's an object key, reset above.
````

- [x] **Step 4: Run all tests**

Run: `cd test && go test ./...`
Expected: `ok`.

- [x] **Step 5: Measure**

Run: `pnpm gaps`
Expected: `agreement 96.2%: wrong 156, missing 6167`. The `typeReference → statement` row (`core.$constructor<…>`) is gone; `typeReference → (none)` grows by the same names, which are type references the highlighter leaves plain (gap a).

- [x] **Step 6: Commit**

```bash
git add test/fixtures/keywords-as-names.ts typescript-rules.yaml test/gaps/REPORT.md
git commit -m "fix(syntax): stop matching keywords inside names with a dollar sign"
```

---

### Task 6: Check the samples changed only where intended

**Files:** none committed.

- [x] **Step 1: Compare every sample with `master`'s rules**

Save this temporary program as `test/cmd/samecolours/main.go`:

````go
// Command samecolours prints each line of the given files whose groups
// differ between the rules file in os.Args[1] and the current rules.
// Temporary: delete this directory after use.
package main

import (
	"fmt"
	"os"
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
	for _, p := range os.Args[2:] {
		src, err := os.ReadFile(p)
		if err != nil {
			panic(err)
		}
		ft := "typescript"
		if strings.HasSuffix(p, ".tsx") {
			ft = "tsx"
		}
		b, a := syntaxtest.Groups(before[ft], string(src)), syntaxtest.Groups(after[ft], string(src))
		lines := strings.Split(string(src), "\n")
		n := 0
		for i := range b {
			if strings.Join(b[i], "|") != strings.Join(a[i], "|") {
				n++
				fmt.Printf("%s:%d %s\n", p, i+1, strings.TrimSpace(lines[i]))
			}
		}
		fmt.Printf("%s: %d lines changed\n", p, n)
	}
}
````

Run from `test/`:

```bash
git show master:typescript-rules.yaml > rules-master.yaml
go run ./cmd/samecolours rules-master.yaml ../sample.ts ../sample.tsx ../dev/sample/demo.ts ../dev/sample/demo.tsx
rm -r cmd/samecolours rules-master.yaml
```

Expected, exactly:

```text
../sample.ts:6 type Params = {
../sample.ts:97 type K = keyof T; const y = z satisfies T;
../sample.ts:98 const enum E { A }
../sample.ts:109 const type = 'x'; let get = 1;
../sample.ts: 4 lines changed
../sample.tsx: 0 lines changed
../dev/sample/demo.ts:9 export enum Role { Admin = 'admin', User = 'user' }
../dev/sample/demo.ts:10 export const enum Flag { Off = 0, On = 1 }
../dev/sample/demo.ts:12 interface User<T extends object = {}> {
../dev/sample/demo.ts:19 type Key = keyof User;
../dev/sample/demo.ts:20 type Maybe<T> = T extends null | undefined ? never : T;
../dev/sample/demo.ts:29 abstract class Store<T> implements Iterable<T> {
../dev/sample/demo.ts: 6 lines changed
../dev/sample/demo.tsx:7 type Props = { title: string; children?: ReactNode };
../dev/sample/demo.tsx: 1 lines changed
```

All are declarations (gap b), except `sample.ts:109`, where only the spaces around `=` change from no group to `default`. Both render plain, so nothing visible changes there.

- [x] **Step 2: Note the remaining gaps for the user**

Read the top rows of `test/gaps/REPORT.md` and report what is left, largest first. On the scratch run these were:
- **a:** user type names in type positions (`typeReference → (none)`).
- **e:** multi-line `${…}` (`identifier → constant.string`).
- **`default: "…"` keys:** micro runs patterns only on the text before a string region, so the switch-label rule's `\s*$` matches before the opening quote (`identifier → statement`, 28 chars).
- **Method signatures:** type parameters such as `lookAhead<T>(…)` (`typeParameterName → (none)`, 38 chars).
- **f:** JSX boolean attributes.
