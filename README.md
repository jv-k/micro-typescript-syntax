# micro-typescript-syntax

TypeScript syntax highlighting for the [micro](https://micro-editor.github.io/) editor.
It covers `.ts`, `.mts` and `.cts` files, plus `.tsx` with JSX.

| File | Role |
|---|---|
| `typescript.yaml` | TypeScript rules |
| `tsx.yaml` | `.tsx` files: the TypeScript rules, then the JSX rules |
| `jsx-tags.yaml` | JSX rules, included by `tsx.yaml` only |

## Install

Link the syntax files into micro's runtime directory:

```sh
mkdir -p ~/.config/micro/syntax
for f in typescript tsx jsx-tags; do
  ln -s "$PWD/$f.yaml" ~/.config/micro/syntax/$f.yaml
done
```

## Colour scheme

The rules use extra sub-groups for finer colouring, such as `constant.quotes`,
`constant.tplLiterals.expression`, `statement.const`, `identifier.function` and
`type.types`. They're designed for the
[mojokai](https://github.com/jv-k/micro-mojokai-colorscheme) colour scheme. With any
other scheme, micro falls back to each sub-group's parent (`constant`,
`statement`, …), so highlighting still works with fewer distinct colours.

Groups the scheme can add for finer control: `constant.string.regex` (regex
literals), `statement.tag` and `type.tag` (JSX elements and components) and
`identifier.attribute` (JSX attributes).

## Developing

Open `sample.ts` or `sample.tsx` in micro, edit a syntax file, then press
`Ctrl-e` and run `reload` to pick up the changes without restarting. The
second half of `sample.ts` and all of `sample.tsx` collect the edge cases the
rules are meant to handle.

Micro colours whole regex matches, without capture groups, so several rules
paint a broad span and let later rules repaint part of it. The comments in
`typescript.yaml` mark where the order matters.

## Known limitations

Micro's highlighter matches one line at a time with Go regular expressions,
which have no lookbehind and can't balance brackets, so some cases rely on
heuristics:

- **Regex literals:**
  - A `/` counts as a regex when no letter or digit touches it and the next
    character isn't a space, so `(a)/b/c` reads as a regex.
  - A regex with an unescaped `>` outside a character class isn't coloured.
  - A quote inside a regex is only kept from opening a string when the regex
    follows an operator, a bracket, `return` or `typeof`.
- **Arrow functions:** the name isn't coloured when a parameter holds
  parentheses or a string, as in `(a = f()) =>`.
- **JSX:**
  - Keywords in text between tags, such as `for` and `in`, are coloured.
  - An opening tag directly after a word (`text<b>`) isn't recognised, since it
    looks like a generic.
  - Attributes without a value aren't coloured.
- **Template literals:** `${…}` handles one level of nested braces.
- **Micro bug:** a string body as long as its start column (zero-based) loses
  its inner colours. One example is `node:fs/promises` on line 2 of
  `sample.ts`, whose body starts at column 16 and is 16 characters long. The
  cause is in micro's `highlightRegion`, which compares an absolute column with
  a relative one.

## TODO

### Add React / Next

- `useRouter`
- `ReactNode`
- `ReactElement`
