# micro-typescript-syntax

TypeScript syntax highlighting for the [micro](https://micro-editor.github.io/) editor.
It covers `.ts`, `.tsx`, `.mts` and `.cts` files.

## Install

Link the syntax file into micro's runtime directory:

```sh
mkdir -p ~/.config/micro/syntax
ln -s "$PWD/typescript.yaml" ~/.config/micro/syntax/typescript.yaml
```

## Colour scheme

The rules use extra sub-groups for finer colouring, such as `constant.quotes`,
`constant.tplLiterals.expression`, `statement.const`, `identifier.function` and
`type.types`. They're designed for the
[mojokai](https://github.com/jv-k/micro-mojokai-colorscheme) colour scheme. With any
other scheme, micro falls back to each sub-group's parent (`constant`,
`statement`, …), so highlighting still works with fewer distinct colours.

## Developing

Open `sample.ts` in micro, edit `typescript.yaml`, then press `Ctrl-e` and run
`reload` to pick up the changes without restarting. The second half of
`sample.ts` collects the edge cases the rules are meant to handle.

## Known limitations

- **Regex literals** aren't highlighted. A quote inside one, as in `/["']/`, opens a
  string that runs on. Telling `/` the operator from `/` the regex delimiter needs
  context micro's regexes can't express.
- **JSX** in `.tsx` files isn't highlighted.
- **Arrow functions** don't get the function-name colour. Micro colours whole
  matches, not capture groups, so the name can't be singled out reliably.
- **Template literals** handle one level of nested braces in `${…}`.
- **`default: x`** as an object key is coloured as the `switch` label.

## TODO

### Add React / Next

- `useRouter`
- `ReactNode`
- `ReactElement`
