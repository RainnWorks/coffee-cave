#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

// This script is used to watch for changes from the project root directory where Manifest is installed.
const path = require("path");
const os = require("os");
const spawn = require("cross-spawn");

// Determine the appropriate nodemon path.
const nodemonExecutable = os.platform() === "win32" ? "nodemon.cmd" : "nodemon";

// Use require.resolve to find nodemon regardless of where it's installed in the monorepo
let nodemonPath;
try {
  // First try to resolve the binary directly
  nodemonPath = require.resolve(`nodemon/bin/${nodemonExecutable}`);
} catch (error) {
  // Fallback to resolving the package and then constructing the path
  try {
    const nodemonPackagePath = require.resolve("nodemon/package.json");
    const nodemonDir = path.dirname(nodemonPackagePath);
    nodemonPath = path.join(nodemonDir, "bin", nodemonExecutable);
  } catch (fallbackError) {
    console.error("Could not find nodemon. Make sure it's installed.");
    process.exit(1);
  }
}

let manifestRoot;
// Fallback to resolving the package and then constructing the path
try {
  const manifestPackagePath = require.resolve("manifest/package.json");
  const manifestDir = path.dirname(manifestPackagePath);
  manifestRoot = path.join(manifestDir);
} catch (fallbackError) {
  console.error("Could not find manifest. Make sure it's installed.");
  process.exit(1);
}

const packageRoot = path.join(__dirname, "..");

const watchFiles = [
  "--watch",
  `${packageRoot}/manifest/*.yml`,
  "--watch",
  `${packageRoot}/manifest/handlers/*.js`,
];
const ext = ["--ext", "yml,js"];
const exec = [
  "--exec",
  `sh -c "cd ${packageRoot} &&\\
  DB_PATH=${path.join(packageRoot, "manifest/backend.db")}\\
  PUBLIC_FOLDER=${path.join(packageRoot, "public")}\\
  MANIFEST_HANDLERS_FOLDER=${path.join(packageRoot, "manifest/handlers")}\\
  MANIFEST_FILE_PATH=${path.join(
    packageRoot,
    "manifest/backend.yml"
  )} node ${path.join(manifestRoot, "dist/manifest/src/main.js")}"`,
];

const nodemon = spawn(nodemonPath, [...ext, ...exec, ...watchFiles], {
  stdio: "inherit",
  shell: true,
});
nodemon.on("close", (code) => {
  console.log(`nodemon process exited with code ${code}`);
});
