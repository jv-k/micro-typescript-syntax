# micro-typescript-syntax

These syntax files add colours to TypeScript code in the
[micro](https://micro-editor.github.io/) text editor.

The syntax files apply to these files:

- `.ts`, `.mts` and `.cts` files.
- `.tsx` files, which also contain JSX.

The syntax files also identify common React and Next.js types, for example
`ReactNode`, `FC` and `NextPage`. They also identify React hooks, for example
`useState` and `useRouter`.

| File | Function |
|---|---|
| `typescript.yaml` | Contains the TypeScript rules. |
| `tsx.yaml` | Applies to `.tsx` files. It uses the TypeScript rules, then the JSX rules. |
| `jsx-tags.yaml` | Contains the JSX rules. Only `tsx.yaml` uses this file. |
| `typescript_syntax.lua`, `repo.json` | Make this repository a micro plugin. |

## Install

This repository is a micro plugin. To install it, clone it into the micro
plugin directory:

```sh
git clone https://github.com/jv-k/micro-typescript-syntax \
  "${MICRO_CONFIG_HOME:-${XDG_CONFIG_HOME:-$HOME/.config}/micro}/plug/typescript_syntax"
```

Then restart micro.

### Update

To update the plugin, pull the latest version into the plugin directory:

```sh
git -C "${MICRO_CONFIG_HOME:-${XDG_CONFIG_HOME:-$HOME/.config}/micro}/plug/typescript_syntax" pull
```

Then restart micro.

### Reload

The micro `reload` command does not load plugins again. After a `reload`,
restart micro to get the colours back.

## Install with an agent

To let a coding agent install the plugin, give it this prompt. To update an
existing install, give the agent the same prompt again.

```text
Install the micro-typescript-syntax plugin for the micro text editor.

1. Make sure that micro is installed. If it is not installed, stop and tell me.
2. Find the micro configuration directory. Use $MICRO_CONFIG_HOME if it is
   set. If not, use $XDG_CONFIG_HOME/micro. If neither is set, use
   ~/.config/micro.
3. Look for the directory plug/typescript_syntax in the configuration
   directory. If it exists and is a clone of
   https://github.com/jv-k/micro-typescript-syntax, do a git pull in it.
   If it exists and is not that clone, stop and tell me.
4. If the directory does not exist, clone
   https://github.com/jv-k/micro-typescript-syntax into it.
5. Look in the syntax subdirectory of the configuration directory for
   typescript.yaml, tsx.yaml and jsx-tags.yaml. Micro uses these files
   before the plugin. Do not change or delete them. Tell me which of them
   exist and where they point if they are links.
6. Tell me the plugin path and the installed commit. Tell me to restart
   micro.
```

## Colour scheme

Each rule gives a colour group to a part of the code. A colour scheme sets the
colour of each group.

The rules use subgroups to show more differences, for example
`constant.quotes`, `statement.const` and `type.types`. The
[mojokai](https://github.com/jv-k/micro-mojokai-colorscheme) colour scheme
sets colours for these subgroups. If your colour scheme does not set a colour
for a subgroup, micro uses the colour of the parent group. For example, micro
uses the `constant` colour for `constant.quotes`.

A colour scheme can also set colours for these groups:

| Group | Code |
|---|---|
| `constant.string.regex` | Regular expression literals |
| `statement.tag` | JSX elements, for example `<div>` |
| `type.tag` | JSX components, for example `<Layout>` |
| `identifier.attribute` | JSX attributes |
| `identifier.function.hook` | React hooks |

## Change the rules

The `reload` command does not load plugins again. Thus, to test changes with
`reload`, link the syntax files into the micro syntax directory. Do this
instead of the plugin install:

```sh
mkdir -p ~/.config/micro/syntax
for f in typescript tsx jsx-tags; do
  ln -s "$PWD/$f.yaml" ~/.config/micro/syntax/$f.yaml
done
```

To update these files, do a `git pull` in this repository. The links then
point to the new versions.

To test a change:

1. Open `sample.ts` or `sample.tsx` in micro.
2. Edit a syntax file.
3. Push `Ctrl-e` and type `reload`. Micro loads the changed syntax files.
4. Examine the colours in the sample file.

The second half of `sample.ts` contains special cases for the rules. All of
`sample.tsx` contains special cases.

Micro gives a colour to all of the text that a rule finds. A rule cannot give a
colour to only one part of that text. Thus some rules give a colour to a large
part of the text. Then a subsequent rule changes the colour of a smaller part.
For these rules, the sequence is important. The comments in `typescript.yaml`
identify these rules.

## Known limits

Micro examines one line at a time. It uses Go regular expressions. These
expressions cannot examine the text before a match, and they cannot count
brackets. Thus some rules use approximate tests, and these tests are not always
correct.

### Regular expression literals

- The rules can show a `/` as the start of a regular expression. This occurs
  when no letter or digit is immediately before the `/`, and no space is
  immediately after it. Thus `(a)/b/c` shows as a regular expression.
- The rules do not give a colour to a regular expression that contains a `>`
  outside a character class. A `\>` does not cause this problem.
- A quote in a regular expression can start a string by mistake. The rules
  prevent this only when the regular expression comes after an operator, a
  bracket, `return` or `typeof`.

### Arrow functions

- The rules do not give a colour to the function name when a parameter contains
  parentheses or a string. An example is `(a = f()) =>`.

### JSX

- Keywords in the text between tags have the keyword colour, for example `for`
  and `in`.
- The rules do not identify an opening tag immediately after a word, for
  example `text<b>`. This text is the same as a generic type.
- Attributes without a value do not have a colour.

### Template literals

- The rules find the end of `${…}` correctly when it contains one level of
  braces, for example `${f({ a })}`. With more levels, the colour stops too
  early.

### Micro bug

Some strings lose the colours of the text in them, for example escape
sequences. This occurs when the string body starts at column N, counted from 0,
and has N characters. An example is `node:fs/promises` on line 2 of
`sample.ts`. Its body starts at column 16 and has 16 characters.

The cause is in the micro function `highlightRegion`. The function compares a
column in the full line with a column in a part of the line. Refer to issue
[micro#4018](https://github.com/micro-editor/micro/issues/4018). Pull request
[micro#4022](https://github.com/micro-editor/micro/pull/4022) contains a fix.
