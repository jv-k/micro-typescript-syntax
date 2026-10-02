#!/usr/bin/env bash
# Bump the plugin version, then commit, tag and push the release.
#
# Usage: pnpm bump-release [patch|minor|major|X.Y.Z] [--yes] [--dry-run]
#
# The version lives in two places: VERSION in typescript_syntax.lua and the
# Versions list in repo.json, newest first. micro's plugin manager reads
# repo.json and downloads the tag's GitHub archive.
set -euo pipefail

cd "$(dirname "$0")/.."

repo_url="https://github.com/jv-k/micro-typescript-syntax"
lua_file="typescript_syntax.lua"
bump="patch"
yes=false
dry_run=false

for arg in "$@"; do
  case "$arg" in
    patch | minor | major) bump="$arg" ;;
    [0-9]*.[0-9]*.[0-9]*) bump="$arg" ;;
    --yes | -y) yes=true ;;
    --dry-run) dry_run=true ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: pnpm bump-release [patch|minor|major|X.Y.Z] [--yes] [--dry-run]" >&2
      exit 1
      ;;
  esac
done

# ─── Preconditions ───────────────────────────────────────────────────────────

branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "master" ]; then
  echo "Release from master, not $branch." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Commit or stash your changes first." >&2
  exit 1
fi

git fetch --quiet origin master --tags
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/master)" ]; then
  echo "master is not in sync with origin/master. Pull or push first." >&2
  exit 1
fi

# ─── Versions ────────────────────────────────────────────────────────────────

current=$(sed -n 's/^VERSION = "\(.*\)"$/\1/p' "$lua_file")
if ! [[ "$current" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "Can't read VERSION from $lua_file (got '$current')." >&2
  exit 1
fi
major=${BASH_REMATCH[1]} minor=${BASH_REMATCH[2]} patch=${BASH_REMATCH[3]}

case "$bump" in
  patch) next="$major.$minor.$((patch + 1))" ;;
  minor) next="$major.$((minor + 1)).0" ;;
  major) next="$((major + 1)).0.0" ;;
  *) next="$bump" ;;
esac

if git rev-parse --quiet --verify "refs/tags/v$next" >/dev/null; then
  echo "Tag v$next already exists." >&2
  exit 1
fi

echo "Release: $current -> $next"
echo "  - $lua_file: VERSION = \"$next\""
echo "  - repo.json: add $next -> $repo_url/archive/v$next.zip"
echo "  - commit 'chore(release): v$next', tag v$next, push master and the tag"

if $dry_run; then
  echo "Dry run: nothing changed."
  exit 0
fi

if ! $yes; then
  read -r -p "Continue? [y/N] " answer
  case "$answer" in
    y | Y | yes) ;;
    *) echo "Stopped: nothing changed."; exit 1 ;;
  esac
fi

# ─── Release ─────────────────────────────────────────────────────────────────

sed -i.bak "s/^VERSION = \".*\"$/VERSION = \"$next\"/" "$lua_file"
rm "$lua_file.bak"

node - "$next" "$repo_url" <<'EOF'
const fs = require("fs");
const [next, repoUrl] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync("repo.json", "utf8"));
const versions = manifest[0].Versions;
const requirement = versions[0]?.Require ?? { micro: ">=2.0.0" };
versions.unshift({ Version: next, Url: `${repoUrl}/archive/v${next}.zip`, Require: requirement });
fs.writeFileSync("repo.json", JSON.stringify(manifest, null, 2) + "\n");
EOF

git add "$lua_file" repo.json
git commit --quiet -m "chore(release): v$next"
git tag -a "v$next" -m "v$next"
git push --quiet origin master "v$next"

echo "Released v$next: $repo_url/releases/tag/v$next"
echo "Once plugin-channel lists this plugin, add $next to its"
echo "plugins/typescript_syntax.json in a PR, with the zip for its plugins release."
