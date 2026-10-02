#!/usr/bin/env bash
#
# dev/screenshots.sh: regenerate img/screenshot-<scheme>.png via vhs, one PNG
# per colour scheme, with dev/sample/demo.ts and demo.tsx in two panes.
#
# Runs micro against an isolated config in img/tmp/<scheme>/micro-config, with
# this repository installed as its plugin, so your own settings, plugins and
# syntax files never leak into the screenshots.
#
# Usage:
#   ./dev/screenshots.sh                       # all schemes
#   SCHEMES="mojokai-tc" ./dev/screenshots.sh  # some schemes
#   MOJOKAI_FILE=../micro-mojokai-theme/mojokai-tc.micro ./dev/screenshots.sh
#
# mojokai-tc comes from MOJOKAI_FILE if set, otherwise from GitHub. The other
# schemes are built into micro.
#
# Requires: vhs (https://github.com/charmbracelet/vhs), micro and curl on PATH.
# Install: brew install vhs micro

set -eo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

for cmd in vhs micro curl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "screenshots: $cmd not found on PATH. Install with: brew install $cmd" >&2
    exit 127
  fi
done

read -r -a schemes <<<"${SCHEMES:-mojokai-tc dracula-tc one-dark gruvbox-tc dukelight-tc}"
MOJOKAI_URL="https://raw.githubusercontent.com/jv-k/micro-mojokai-colorscheme/master/mojokai-tc.micro"

for scheme in "${schemes[@]}"; do
  dir="img/tmp/$scheme"
  config="$dir/micro-config"

  # Start from a clean config every run. vhs can also leave a directory of
  # frames at a `Screenshot` path, so remove both shapes.
  rm -rf -- "$dir" "img/screenshot-$scheme.png"
  mkdir -p "$config/plug" "$config/colorschemes"
  ln -s "$REPO_ROOT" "$config/plug/typescript_syntax"

  if [ "$scheme" = "mojokai-tc" ]; then
    if [ -n "$MOJOKAI_FILE" ]; then
      cp "$MOJOKAI_FILE" "$config/colorschemes/mojokai-tc.micro"
    else
      curl -fsSL "$MOJOKAI_URL" -o "$config/colorschemes/mojokai-tc.micro"
    fi
  fi

  cat >"$config/settings.json" <<EOF
{
    "colorscheme": "$scheme",
    "truecolor": "on",
    "multiopen": "vsplit",
    "statusformatr": "",
    "diffgutter": false,
    "savecursor": false,
    "saveundo": false
}
EOF

  sed -e "s|{{SCHEME}}|$scheme|g" -e "s|{{CONFIG}}|$config|g" \
    dev/screenshot.tape >"$dir/screenshot.tape"
  vhs "$dir/screenshot.tape"
  echo "screenshots: wrote img/screenshot-$scheme.png"
done

echo "screenshots: intermediate files are in img/tmp/"
