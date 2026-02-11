#!/usr/bin/env node

// Performance Budget Validation Gate
// Purpose: Prevent bundle bloat and performance regressions
// Exit codes: 0 = All budgets met, 1 = Budget violations detected

import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import zlib from "node:zlib";

const _execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(REPO_ROOT, "marketplace", "dist");

// Performance budgets
const BUDGETS = {
  totalSize: 3 * 1024 * 1024, // 3MB gzipped (increased for SaaS skill packs)
  largestFile: 150 * 1024, // 150KB gzipped (accommodates explore page)
  buildTime: 10 * 1000, // 10 seconds (ms)
  routeCount: {
    min: 500,
    max: 650, // Increased for /learn/ hub pages
  },
};

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

async function gzipSize(filePath) {
  const content = await fs.promises.readFile(filePath);
  return new Promise((resolve, reject) => {
    zlib.gzip(content, (err, compressed) => {
      if (err) reject(err);
      else resolve(compressed.length);
    });
  });
}

async function walkDir(dir, fileList = []) {
	const dirents = await fs.promises.readdir(dir, { withFileTypes: true });

	await Promise.all(
		dirents.map(async (dirent) => {
			const filePath = path.join(dir, dirent.name);

			let isDirectory = dirent.isDirectory();
			if (dirent.isSymbolicLink()) {
				try {
					const stat = await fs.promises.stat(filePath);
					isDirectory = stat.isDirectory();
				} catch (e) {
					// Only ignore errors that indicate a broken symlink
					if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) {
						isDirectory = false;
					} else {
						throw e;
					}
				}
			}

			if (isDirectory) {
				await walkDir(filePath, fileList);
			} else {
				fileList.push(filePath);
			}
		}),
	);

  return fileList;
}

async function countRoutes() {
	let count = 0;

	async function walk(dir) {
		const dirents = await fs.promises.readdir(dir, { withFileTypes: true });

		for (const dirent of dirents) {
			if (dirent.name === "index.html") {
				count++;
				break;
			}
		}

		const subdirectoryPromises = dirents
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => {
				const fullPath = path.join(dir, dirent.name);
				return walk(fullPath);
			});

		await Promise.all(subdirectoryPromises);
	}

	await walk(DIST_DIR);
	return count;
}


// Queue implementation for O(1) operations
class Node {
  constructor(value) {
    this.value = value;
    this.next = undefined;
  }
}

class Queue {
  constructor() {
    this.head = undefined;
    this.tail = undefined;
    this.size = 0;
  }

  enqueue(value) {
    const node = new Node(value);

    if (this.head) {
      this.tail.next = node;
      this.tail = node;
    } else {
      this.head = node;
      this.tail = node;
    }

    this.size++;
  }

  dequeue() {
    const current = this.head;
    if (!current) {
      return;
    }

    this.head = this.head.next;
    this.size--;

    return current.value;
  }
}

// Simple concurrency limiter
function pLimit(concurrency) {
  const queue = new Queue();
  let activeCount = 0;
  let head = null;
  let tail = null;

  const next = () => {
    activeCount--;
    if (queue.size > 0) {
      queue.dequeue()();
    }
  };

  const run = async (fn, resolve, args) => {
    activeCount++;
    const result = (async () => fn(...args))();
    resolve(result);
    try {
      await result;
    } catch {}
    next();
  };

  const generator = (fn, ...args) =>
    new Promise((resolve) => {
      const enqueue = () => queue.enqueue(() => run(fn, resolve, args));
      const runImmediate = () => run(fn, resolve, args);

      if (activeCount < concurrency) {
        runImmediate();
      } else {
        enqueue();
      }
    });

  return generator;
}

async function walkDir(dir, fileList = [], limit = null) {
  if (!limit) limit = pLimit(50); // Default shared limiter if none provided

  // Limit readdir concurrency
  const dirents = await limit(() =>
    fs.promises.readdir(dir, { withFileTypes: true }),
  );

  await Promise.all(
    dirents.map(async (dirent) => {
      const filePath = path.join(dir, dirent.name);

      let isDirectory = dirent.isDirectory();
      if (dirent.isSymbolicLink()) {
        try {
          // Limit stat concurrency
          const stat = await limit(() => fs.promises.stat(filePath));
          isDirectory = stat.isDirectory();
        } catch (e) {
          // Only ignore errors that indicate a broken symlink
          if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) {
            isDirectory = false;
          } else {
            throw e;
          }
        }
      }

      if (isDirectory) {
        // Recursive call passes the shared limit, but does NOT wrap itself in limit
        // to avoid deadlocks (waiting for children while holding a parent slot).
        await walkDir(filePath, fileList, limit);
      } else {
        fileList.push(filePath);
      }
    }),
  );

  return fileList;
}

async function countRoutes() {
  let count = 0;

  async function walk(dir) {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const dirent of dirents) {
      if (dirent.name === "index.html") {
        count++;
        break;
      }
    }

    const subdirectoryPromises = dirents
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => {
        const fullPath = path.join(dir, dirent.name);
        return walk(fullPath);
      });

    await Promise.all(subdirectoryPromises);
  }

  await walk(DIST_DIR);
  return count;
}

async function analyzeBundleSize() {
  log("Analyzing bundle size...", "blue");

  const files = await walkDir(DIST_DIR);

  const limit = pLimit(50);

  const results = await Promise.all(
    files.map((file) =>
      limit(async () => {
        const stat = await fs.promises.stat(file);
        const gzipped = await gzipSize(file);
        return {
          path: path.relative(DIST_DIR, file),
          size: stat.size,
          gzipped,
        };
      }),
    ),
  );

  let totalSize = 0;
  let totalGzippedSize = 0;

  for (const result of results) {
    totalSize += result.size;
    totalGzippedSize += result.gzipped;
  }

  // Sort by gzipped size
  results.sort((a, b) => b.gzipped - a.gzipped);

  return {
    totalSize,
    totalGzippedSize,
    fileCount: files.length,
    largestFiles: results.slice(0, 10),
    largestFile: results[0],
  };
}

async function main() {
  const startTime = Date.now();

  log("\n=== Performance Budget Validation Gate ===\n", "bold");

  // Check if dist exists
  if (!fs.existsSync(DIST_DIR)) {
    log(`Error: Dist directory not found at ${DIST_DIR}`, "red");
    log('Run "cd marketplace && npm run build" first', "yellow");
    process.exit(1);
  }

  log("Performance budgets:", "blue");
  log(`  - Total size: < ${formatBytes(BUDGETS.totalSize)} (gzipped)`, "blue");
  log(
    `  - Largest file: < ${formatBytes(BUDGETS.largestFile)} (gzipped)`,
    "blue",
  );
  log(`  - Build time: < ${BUDGETS.buildTime / 1000}s`, "blue");
  log(
    `  - Route count: ${BUDGETS.routeCount.min}-${BUDGETS.routeCount.max}`,
    "blue",
  );
  log("");

  const violations = [];

  // 1. Bundle Size Analysis
  log("1. Analyzing bundle size...", "bold");
  const bundleAnalysis = await analyzeBundleSize();

  log(`   Total files: ${bundleAnalysis.fileCount}`, "blue");
  log(`   Total size (raw): ${formatBytes(bundleAnalysis.totalSize)}`, "blue");
  log(
    `   Total size (gzipped): ${formatBytes(bundleAnalysis.totalGzippedSize)}`,
    "blue",
  );

  if (bundleAnalysis.totalGzippedSize > BUDGETS.totalSize) {
    const overage = bundleAnalysis.totalGzippedSize - BUDGETS.totalSize;
    log(`   ✗ Over budget by ${formatBytes(overage)}`, "red");
    violations.push({
      check: "Total Bundle Size",
      budget: formatBytes(BUDGETS.totalSize),
      actual: formatBytes(bundleAnalysis.totalGzippedSize),
      overage: formatBytes(overage),
    });
  } else {
    const remaining = BUDGETS.totalSize - bundleAnalysis.totalGzippedSize;
    log(`   ✓ Under budget by ${formatBytes(remaining)}`, "green");
  }

  // 2. Largest File Check
  log("\n2. Checking largest file...", "bold");

  if (bundleAnalysis.largestFile) {
    const largest = bundleAnalysis.largestFile;
    log(`   Largest file: ${largest.path}`, "blue");
    log(`   Size (raw): ${formatBytes(largest.size)}`, "blue");
    log(`   Size (gzipped): ${formatBytes(largest.gzipped)}`, "blue");

    if (largest.gzipped > BUDGETS.largestFile) {
      const overage = largest.gzipped - BUDGETS.largestFile;
      log(`   ✗ Over budget by ${formatBytes(overage)}`, "red");
      violations.push({
        check: "Largest File",
        budget: formatBytes(BUDGETS.largestFile),
        actual: formatBytes(largest.gzipped),
        file: largest.path,
        overage: formatBytes(overage),
      });
    } else {
      const remaining = BUDGETS.largestFile - largest.gzipped;
      log(`   ✓ Under budget by ${formatBytes(remaining)}`, "green");
    }
  } else {
    log(`   No files found in dist`, "yellow");
  }

  // 3. Top 5 largest files
  if (bundleAnalysis.largestFiles.length > 0) {
    log("\n   Top 5 largest files (gzipped):", "blue");
    for (let i = 0; i < Math.min(5, bundleAnalysis.largestFiles.length); i++) {
      const file = bundleAnalysis.largestFiles[i];
      log(`     ${i + 1}. ${file.path} - ${formatBytes(file.gzipped)}`, "blue");
    }
  }

  // 4. Route Count
  log("\n3. Counting routes...", "bold");
  const routeCount = await countRoutes();
  log(`   Routes found: ${routeCount}`, "blue");

  if (
    routeCount < BUDGETS.routeCount.min ||
    routeCount > BUDGETS.routeCount.max
  ) {
    log(
      `   ✗ Outside expected range (${BUDGETS.routeCount.min}-${BUDGETS.routeCount.max})`,
      "red",
    );
    violations.push({
      check: "Route Count",
      budget: `${BUDGETS.routeCount.min}-${BUDGETS.routeCount.max}`,
      actual: routeCount,
    });
  } else {
    log(`   ✓ Within expected range`, "green");
  }

  // 4. Build Time Check (note in output, but can't measure retroactively)
  log("\n4. Build time check...", "bold");
  log("   Note: Build time must be measured externally", "yellow");
  log(`   Budget: < ${BUDGETS.buildTime / 1000}s`, "blue");
  log("   To measure: time npm run build", "blue");

  // Report results
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  log(`\nValidation time: ${elapsedTime}s`, "blue");

  if (violations.length === 0) {
    log("\n✓ All performance budgets met", "green");
    log("");
    process.exit(0);
  } else {
    log(`\n✗ ${violations.length} budget violation(s):\n`, "red");

    for (const violation of violations) {
      log(`  ${violation.check}:`, "red");
      log(`    Budget: ${violation.budget}`, "red");
      log(`    Actual: ${violation.actual}`, "red");
      if (violation.overage) {
        log(`    Overage: ${violation.overage}`, "red");
      }
      if (violation.file) {
        log(`    File: ${violation.file}`, "red");
      }
      log("");
    }

    log(
      `Recommendation: Optimize assets, enable code splitting, or adjust budgets\n`,
      "yellow",
    );
    process.exit(1);
  }
}

main();
