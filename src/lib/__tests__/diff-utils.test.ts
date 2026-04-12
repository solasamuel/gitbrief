import { describe, it, expect } from "vitest";
import {
  truncateDiff,
  filterDiff,
  extractDiffStats,
} from "@/lib/diff-utils";

// --- Test fixtures ---

const SMALL_DIFF = `diff --git a/src/index.ts b/src/index.ts
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
 import { app } from './app';
+import { logger } from './logger';

 app.listen(3000);
`;

const MULTI_FILE_DIFF = `diff --git a/src/auth.ts b/src/auth.ts
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -1,2 +1,5 @@
-export function login() {}
+export function login(user: string, pass: string) {
+  validate(user, pass);
+  return createSession(user);
+}
diff --git a/src/utils.ts b/src/utils.ts
--- a/src/utils.ts
+++ b/src/utils.ts
@@ -10,3 +10,2 @@
-function oldHelper() {}
 function newHelper() {}
+function anotherHelper() {}
`;

const DIFF_WITH_LOCK_AND_BINARY = `diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,2 +1,3 @@
 const app = express();
+app.use(cors());
 export default app;
diff --git a/package-lock.json b/package-lock.json
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,5 +1,10 @@
+lots of lock file content
+more lock file content
+even more lock file content
+and more
+and more
diff --git a/yarn.lock b/yarn.lock
--- a/yarn.lock
+++ b/yarn.lock
@@ -1,2 +1,3 @@
+yarn lock content
diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
--- a/pnpm-lock.yaml
+++ b/pnpm-lock.yaml
@@ -1,2 +1,3 @@
+pnpm lock content
diff --git a/assets/logo.png b/assets/logo.png
Binary files /dev/null and b/assets/logo.png differ
`;

const LARGE_DIFF_FILE1 = `diff --git a/file1.ts b/file1.ts
--- a/file1.ts
+++ b/file1.ts
@@ -1,3 +1,4 @@
 line1
+added1
 line2
 line3
`;

const LARGE_DIFF_FILE2 = `diff --git a/file2.ts b/file2.ts
--- a/file2.ts
+++ b/file2.ts
@@ -1,3 +1,4 @@
 lineA
+addedA
 lineB
 lineC
`;

// --- Tests ---

describe("T-010: truncateDiff cuts at hunk boundaries with marker", () => {
  it("truncates a diff that exceeds the character limit", () => {
    // Create a diff that's bigger than a small limit
    const combined = LARGE_DIFF_FILE1 + LARGE_DIFF_FILE2;
    // Set limit so only the first file fits
    const limit = LARGE_DIFF_FILE1.length + 10;

    const result = truncateDiff(combined, limit);

    expect(result).toContain("file1.ts");
    expect(result).not.toContain("file2.ts");
    expect(result).toContain("[truncated]");
  });

  it("cuts at a file boundary, not mid-hunk", () => {
    const combined = LARGE_DIFF_FILE1 + LARGE_DIFF_FILE2;
    const limit = LARGE_DIFF_FILE1.length + 10;

    const result = truncateDiff(combined, limit);

    // Should contain the complete first file diff
    expect(result).toContain("+added1");
    expect(result).toContain("line3");
  });
});

describe("T-011: truncateDiff passes through small diffs unchanged", () => {
  it("returns the diff unchanged when under the limit", () => {
    const result = truncateDiff(SMALL_DIFF, 100_000);
    expect(result).toBe(SMALL_DIFF);
  });

  it("returns empty string unchanged", () => {
    const result = truncateDiff("", 100_000);
    expect(result).toBe("");
  });

  it("uses default limit of 100,000 characters", () => {
    const result = truncateDiff(SMALL_DIFF);
    expect(result).toBe(SMALL_DIFF);
  });
});

describe("T-012: filterDiff removes lock files and binary markers", () => {
  it("removes package-lock.json sections", () => {
    const result = filterDiff(DIFF_WITH_LOCK_AND_BINARY);
    expect(result).not.toContain("package-lock.json");
  });

  it("removes yarn.lock sections", () => {
    const result = filterDiff(DIFF_WITH_LOCK_AND_BINARY);
    expect(result).not.toContain("yarn.lock");
  });

  it("removes pnpm-lock.yaml sections", () => {
    const result = filterDiff(DIFF_WITH_LOCK_AND_BINARY);
    expect(result).not.toContain("pnpm-lock.yaml");
  });

  it("removes binary file diffs", () => {
    const result = filterDiff(DIFF_WITH_LOCK_AND_BINARY);
    expect(result).not.toContain("Binary files");
    expect(result).not.toContain("logo.png");
  });

  it("preserves non-lock, non-binary file diffs", () => {
    const result = filterDiff(DIFF_WITH_LOCK_AND_BINARY);
    expect(result).toContain("src/app.ts");
    expect(result).toContain("app.use(cors())");
  });

  it("returns empty string when all files are filtered out", () => {
    const lockOnly = `diff --git a/package-lock.json b/package-lock.json
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,2 +1,3 @@
+lock content
`;
    const result = filterDiff(lockOnly);
    expect(result.trim()).toBe("");
  });
});

describe("T-013: extractDiffStats counts files/insertions/deletions", () => {
  it("counts a single file with one insertion", () => {
    const stats = extractDiffStats(SMALL_DIFF);
    expect(stats).toEqual({
      filesChanged: 1,
      insertions: 1,
      deletions: 0,
    });
  });

  it("counts multiple files with mixed changes", () => {
    const stats = extractDiffStats(MULTI_FILE_DIFF);
    expect(stats).toEqual({
      filesChanged: 2,
      insertions: 5,
      deletions: 2,
    });
  });

  it("returns zeros for empty diff", () => {
    const stats = extractDiffStats("");
    expect(stats).toEqual({
      filesChanged: 0,
      insertions: 0,
      deletions: 0,
    });
  });

  it("does not count context lines (lines without +/-)", () => {
    const stats = extractDiffStats(SMALL_DIFF);
    // SMALL_DIFF has context lines like " import { app }" — those should not count
    expect(stats.insertions).toBe(1);
    expect(stats.deletions).toBe(0);
  });
});
