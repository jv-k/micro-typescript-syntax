# TypeScript for micro

Syntax highlighting for TypeScript and TSX in the
[micro](https://micro-editor.github.io/) text editor, with JSX, React and
Next.js support.

![micro with the Mojokai colour scheme. Two panes show a TypeScript file and a TSX file, with keywords, types, strings, regular expressions, JSX tags and React hooks in different colours.](img/screenshot-mojokai-tc.png)

<details>
<summary>More colour schemes</summary>

Dracula:

![The same two files with the Dracula colour scheme.](img/screenshot-dracula-tc.png)

One Dark:

![The same two files with the One Dark colour scheme.](img/screenshot-one-dark.png)

Gruvbox:

![The same two files with the Gruvbox colour scheme.](img/screenshot-gruvbox-tc.png)

Duke Light:

![The same two files with the Duke Light colour scheme.](img/screenshot-dukelight-tc.png)

</details>

The syntax files apply to these files:

- `.ts`, `.mts` and `.cts` files.
- `.tsx` files, which also contain JSX.

The syntax files also identify common React and Next.js types, for example
`ReactNode`, `FC` and `NextPage`. They also identify React hooks, for example
`useState` and `useRouter`.

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
   typescript.yaml, typescript-rules.yaml, tsx.yaml and jsx-tags.yaml.
   Micro uses these files before the plugin. Do not change or delete them. Tell me which of them
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

## Edge cases

Micro highlights one line at a time with Go regular expressions, so a few cases
use approximate rules:

- A `/` directly after `)` or `]` can start a regular expression, for example
  `(a)/b/c` or `arr[i]/n/2`.
- A regular expression with an unescaped `>` outside `[…]` has no colour.
- Arrow function names have no colour when a parameter contains parentheses or a
  string, for example `(a = f()) =>`.
- In a ternary that ends in an arrow function, such as `ok ? a : (b) => b`, `a`
  has the function name colour.
- In JSX text, keywords such as `for` and `in` have the keyword colour.
- A JSX tag directly after a word, such as `text<b>`, has no tag colour.
- `${…}` handles one level of nested braces.
- Micro versions without [micro#4022](https://github.com/micro-editor/micro/pull/4022)
  can drop the escape colours in some strings.

## Contributing

To change the rules, update the screenshots, or make a release, refer to
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

[ISC](LICENSE)
