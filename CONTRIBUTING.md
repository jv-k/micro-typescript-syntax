# Contributing

This file is for people who change the syntax files. To install or update
them, refer to the [README](README.md).

## Files

| File | Function |
|---|---|
| `typescript-rules.yaml` | Contains the TypeScript rules. |
| `typescript.yaml` | Applies to `.ts`, `.mts` and `.cts` files. It uses the TypeScript rules. |
| `tsx.yaml` | Applies to `.tsx` files. It uses the TypeScript rules, then the JSX rules. |
| `jsx-tags.yaml` | Contains the JSX rules. Only `tsx.yaml` uses this file. |
| `typescript_syntax.lua`, `repo.json` | Make this repository a micro plugin. |
| `sample.ts`, `sample.tsx` | Special cases for the rules. |
| `dev/` | The screenshot script and the demo files that it shows. |
| `test/` | The tests for the rules. They use the highlighter from micro. |
| `test/fixtures/` | Test files. Each file has the expected colours below the code. |

## Change the rules

1. Link the syntax files into the micro syntax directory, so that micro reads
   the files in this repository. Do this instead of the plugin install, because
   the micro `reload` command does not load plugins again:

   ```sh
   mkdir -p ~/.config/micro/syntax
   for f in typescript typescript-rules tsx jsx-tags; do
     ln -s "$PWD/$f.yaml" ~/.config/micro/syntax/$f.yaml
   done
   ```

2. Open `sample.ts` or `sample.tsx` in micro.
3. Edit a syntax file.
4. In micro, push `Ctrl-e` and type `reload` to see the change.
5. Run `pnpm screenshots` to make new screenshots. Refer to
   [Update the screenshots](#update-the-screenshots).
6. Commit the changes. Use
   [Conventional Commits](https://www.conventionalcommits.org/), for example
   `fix(syntax): ...` or `feat(syntax): ...`.
7. Make a release. Refer to [Make a release](#make-a-release).
8. Remove the links from step 1 when you finish. Micro uses the files in its
   syntax directory before the plugin, so the links hide the installed plugin:

   ```sh
   for f in typescript typescript-rules tsx jsx-tags; do
     rm ~/.config/micro/syntax/$f.yaml
   done
   ```

The second half of `sample.ts` contains special cases for the rules. All of
`sample.tsx` contains special cases.

Micro gives a colour to all of the text that a rule finds. A rule cannot give a
colour to only one part of that text. Thus some rules give a colour to a large
part of the text. Then a subsequent rule changes the colour of a smaller part.
For these rules, the sequence is important. The comments in
`typescript-rules.yaml` identify these rules.

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

## Update the screenshots

To make new screenshots in `img/`, run this command:

```sh
pnpm screenshots
```

The command needs [vhs](https://github.com/charmbracelet/vhs), micro and the
Fira Code font. It makes one screenshot for each colour scheme, with
`dev/sample/demo.ts` and `dev/sample/demo.tsx` in two panes. Micro starts with
a clean configuration in a temporary directory, so your own micro settings do
not change the result.

To make only some screenshots, set `SCHEMES`, for example
`SCHEMES="mojokai-tc" pnpm screenshots`. To use a local copy of the Mojokai
colour scheme, set `MOJOKAI_FILE` to its path. To change what the screenshots
show, edit `dev/screenshot.tape` and the files in `dev/sample/`.

## Make a release

To make a release, run this command on `master`:

```sh
pnpm bump-release [patch|minor|major|X.Y.Z]
```

The default is `patch`. The command changes the version in
`typescript_syntax.lua` and adds the version to `repo.json`. Then it commits,
tags and pushes the release. It shows the changes and asks before it starts.

To see the changes before the command makes them, run
`pnpm bump-release --dry-run`.
