#!/usr/bin/env node
/**
 * Bump the app version in package.json, src-tauri/tauri.conf.json,
 * and src-tauri/Cargo.toml, then create a git tag.
 *
 * Usage:  node scripts/bump-version.mjs 0.2.0
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const newVersion = process.argv[2];
if (!newVersion || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(newVersion)) {
    console.error("Usage: node scripts/bump-version.mjs <semver>  (e.g. 0.2.0)");
    process.exit(1);
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function bumpJson(rel, key = "version") {
    const file = path.join(root, rel);
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    const old = json[key];
    json[key] = newVersion;
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
    console.log(`  ${rel}: ${old} -> ${newVersion}`);
}

function bumpCargoToml() {
    const file = path.join(root, "src-tauri/Cargo.toml");
    const text = fs.readFileSync(file, "utf8");
    const replaced = text.replace(
        /^version\s*=\s*"[^"]+"/m,
        `version = "${newVersion}"`,
    );
    if (text === replaced) throw new Error("Cargo.toml: version line not found");
    fs.writeFileSync(file, replaced);
    console.log(`  src-tauri/Cargo.toml -> ${newVersion}`);
}

console.log(`Bumping to v${newVersion}…`);
bumpJson("package.json");
bumpJson("src-tauri/tauri.conf.json");
bumpCargoToml();

// Refresh Cargo.lock without doing a full build.
try {
    execSync("cargo update -p nte-progress --precise " + newVersion, {
        cwd: path.join(root, "src-tauri"),
        stdio: "inherit",
    });
} catch {
    console.log("  (cargo update skipped — Cargo.lock will refresh on next build)");
}

console.log("\nNext steps:");
console.log(`  git add -A`);
console.log(`  git commit -m "chore: release v${newVersion}"`);
console.log(`  git tag v${newVersion}`);
console.log(`  git push && git push --tags`);
