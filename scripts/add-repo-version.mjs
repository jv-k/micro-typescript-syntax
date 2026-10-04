// Add the release VerBump is making to repo.json and stage it.
// VerBump runs this as PRE_BUMP_CMD, with the new version in VERBUMP_VERSION
// and the tag in VERBUMP_TAG; micro downloads the tag's GitHub archive.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const { VERBUMP_VERSION: version, VERBUMP_TAG: tag } = process.env;
if (!version || !tag) {
  console.error("Run this through VerBump: pnpm bump-release");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync("repo.json", "utf8"));
const versions = manifest[0].Versions;
versions.unshift({
  Version: version,
  Url: `https://github.com/jv-k/micro-typescript-syntax/archive/${tag}.zip`,
  Require: versions[0]?.Require ?? { micro: ">=2.0.0" },
});
writeFileSync("repo.json", JSON.stringify(manifest, null, 2) + "\n");
execFileSync("git", ["add", "repo.json"]);
