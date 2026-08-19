#!/usr/bin/env node
/**
 * Refuse a release tag whose name disagrees with package.json version.
 *
 * WHY THIS EXISTS, and why it is not only in the publish workflow.
 *
 * v0.28.0, v0.28.1, v0.29.0 and v0.30.0 all declare "version": "0.27.0". The
 * publish workflow's own guard CAUGHT all four — every one of those tag pushes
 * has a `failure` run on 2026-08-07 reading
 *   `Tag v0.30.0 does not match package.json.version 0.27.0`
 * — so nothing above 0.27.0 was ever published to GitHub Packages.
 *
 * It did not help, because **no consumer installs from the registry.** Every
 * consumer pins `github:rello-platform/signals#vX.Y.Z`, which resolves the TAG'S
 * TREE directly. npm never contacts the registry, never sees the failed publish,
 * and happily records the tree's declared version — 0.27.0 — in its lockfile,
 * for code that is demonstrably not 0.27.0.
 *
 * So the workflow guard protects an artifact nobody consumes, and the path
 * everybody consumes had no guard at all. The only moment that can help a
 * git-ref consumer is BEFORE THE TAG EXISTS: once it is pushed, it is
 * installable regardless of what any later job decides.
 *
 * Hence two enforcement points, deliberately:
 *   1. .husky/pre-push  — refuses to push a mismatched vX.Y.Z tag (this file).
 *      Stops the tag existing, which is what protects git-ref consumers.
 *   2. .github/workflows/publish.yml — refuses to PUBLISH a mismatched tag.
 *      Backstop for a tag created through the web UI or pushed with
 *      --no-verify, and the only detector once the tag is already out.
 *
 * Usage:
 *   node scripts/check-version-tag.mjs <tag>     # explicit
 *   node scripts/check-version-tag.mjs           # reads GITHUB_REF_NAME
 * Exit 0 = agree · 1 = disagree · 2 = could not determine (never a pass).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));

export function compare(tag, declaredVersion) {
  if (!tag) return { ok: false, code: 2, reason: "no tag supplied" };
  if (!/^v\d+\.\d+\.\d+/.test(tag)) {
    // Not a release tag — nothing to compare, and refusing would block
    // unrelated tags. Explicitly a pass, not a silent skip.
    return { ok: true, code: 0, reason: `"${tag}" is not a vX.Y.Z release tag — not checked` };
  }
  if (!declaredVersion) return { ok: false, code: 2, reason: "package.json has no version field" };
  const expected = tag.replace(/^v/, "");
  if (expected !== declaredVersion) {
    return {
      ok: false,
      code: 1,
      reason: `tag ${tag} declares ${expected}, package.json declares ${declaredVersion}`,
    };
  }
  return { ok: true, code: 0, reason: `${tag} = v${declaredVersion}` };
}

function main() {
  const tag = process.argv[2] || process.env.GITHUB_REF_NAME || "";
  let declared;
  try {
    declared = JSON.parse(readFileSync(join(HERE, "..", "package.json"), "utf8")).version;
  } catch (err) {
    console.error(`[check-version-tag] UNVERIFIED — cannot read package.json: ${err.message}`);
    process.exit(2);
  }

  const r = compare(tag, declared);
  if (r.code === 0) {
    console.log(`[check-version-tag] OK — ${r.reason}`);
    process.exit(0);
  }
  if (r.code === 2) {
    console.error(`[check-version-tag] UNVERIFIED — ${r.reason}. Not a pass.`);
    process.exit(2);
  }
  console.error(
    `[check-version-tag] REFUSED — ${r.reason}.\n\n` +
      `  A tag whose tree misdeclares its version is not a cosmetic problem here:\n` +
      `  every consumer pins github:rello-platform/signals#<tag>, so npm records the\n` +
      `  DECLARED version in their lockfile. v0.28.0-v0.30.0 all declare 0.27.0, which\n` +
      `  is why five repos' lockfiles read 0.27.0 while running newer code, and why any\n` +
      `  pin-vs-installed parity gate reports drift no lockfile edit can satisfy.\n\n` +
      `  Fix: set package.json version to ${tag.replace(/^v/, "")}, commit, re-tag.\n`,
  );
  process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith("check-version-tag.mjs")) main();
