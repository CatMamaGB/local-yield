/**
 * Audit script for API contract consistency.
 * Scans all route files and reports non-standard response patterns.
 * Run with: npm run audit:api-contracts
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";

interface Issue {
  file: string;
  line: number;
  reason: string;
  suggestion: string;
  code: string;
}

const issues: Issue[] = [];

async function findRouteFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await findRouteFiles(fullPath)));
      } else if (entry.name === "route.ts" || entry.name === "route.js") {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't read
  }
  return files;
}

function analyzeFile(filePath: string, content: string): void {
  const lines = content.split("\n");
  const relativePath = filePath.replace(process.cwd(), "").replace(/\\/g, "/");

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Detect NextResponse.json() calls
    if (trimmed.includes("NextResponse.json(") && !trimmed.includes("//")) {
      issues.push({
        file: relativePath,
        line: lineNum,
        reason: "Direct NextResponse.json() call - should use ok()/fail()/failStructured()",
        suggestion: "Replace with ok(data, requestId) or fail(message, { code, status, requestId })",
        code: trimmed.slice(0, 80),
      });
    }

    // Detect raw return { ok: ... } objects
    if (trimmed.match(/return\s+\{\s*ok:/)) {
      issues.push({
        file: relativePath,
        line: lineNum,
        reason: "Raw object return - should use ok()/fail()/failStructured() helpers",
        suggestion: "Replace with ok(data, requestId) or failStructured({ code, message }, status, requestId)",
        code: trimmed.slice(0, 80),
      });
    }

    // Detect throw new Error without try-catch (heuristic: look for throw in route handlers)
    if (
      trimmed.includes("throw new Error") &&
      !content.includes("try {") &&
      content.includes("export async function")
    ) {
      // Check if there's a try-catch somewhere after this line
      const afterContent = lines.slice(index).join("\n");
      if (!afterContent.includes("try {")) {
        issues.push({
          file: relativePath,
          line: lineNum,
          reason: "throw new Error without structured error boundary - should return fail() or failStructured()",
          suggestion: "Replace with return failStructured({ code: 'ERROR_CODE', message: '...' }, 500, requestId)",
          code: trimmed.slice(0, 80),
        });
      }
    }

    // Detect old-style fail(message, code, status) - should use options object
    if (trimmed.includes("fail(") && trimmed.match(/fail\([^)]+,\s*"[A-Z_]+",\s*\d+/)) {
      issues.push({
        file: relativePath,
        line: lineNum,
        reason: "fail() uses old positional args - use options object: fail(message, { code, status, requestId })",
        suggestion: "Replace with fail(message, { code: 'CODE', status: N, requestId })",
        code: trimmed.slice(0, 80),
      });
    }

    // Detect failStructured() calls without explicit status code
    if (
      trimmed.includes("failStructured(") &&
      !trimmed.match(/failStructured\([^,]+,\s*\d+/)
    ) {
      const match = trimmed.match(/failStructured\([^)]+\)/);
      if (match) {
        const args = match[0]
          .slice(15, -1)
          .split(",")
          .map((a) => a.trim());
        if (args.length < 2 || !/^\d+$/.test(args[1])) {
          issues.push({
            file: relativePath,
            line: lineNum,
            reason: "failStructured() call without explicit status code - should specify status explicitly",
            suggestion: "Add status code: failStructured({ code, message }, 400, requestId)",
            code: trimmed.slice(0, 80),
          });
        }
      }
    }
  });

  // Check if route handler uses requestId
  if (
    content.includes("export async function") &&
    !content.includes("withRequestId") &&
    !content.includes("getRequestId") &&
    !content.includes("requestId")
  ) {
    issues.push({
      file: relativePath,
      line: 1,
      reason: "Route handler doesn't use requestId - should call withRequestId(request) at start",
      suggestion: "Add: const requestId = withRequestId(request); then pass to ok()/fail()/failStructured()",
      code: "export async function",
    });
  }
}

async function main() {
  console.log("Auditing API contracts...\n");

  const apiDir = join(process.cwd(), "app", "api");
  const routeFiles = await findRouteFiles(apiDir);

  console.log(`Found ${routeFiles.length} route files\n`);

  for (const file of routeFiles) {
    try {
      const content = await readFile(file, "utf-8");
      analyzeFile(file, content);
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }

  if (issues.length === 0) {
    console.log("✓ No issues found! All routes follow API contract standards.");
    process.exit(0);
  }

  console.log(`Found ${issues.length} issue(s):\n`);
  console.log("=".repeat(80));

  // Group by file
  const byFile = new Map<string, Issue[]>();
  for (const issue of issues) {
    if (!byFile.has(issue.file)) {
      byFile.set(issue.file, []);
    }
    byFile.get(issue.file)!.push(issue);
  }

  for (const [file, fileIssues] of byFile.entries()) {
    console.log(`\n${file}`);
    console.log("-".repeat(80));
    for (const issue of fileIssues) {
      console.log(`  Line ${issue.line}: ${issue.reason}`);
      console.log(`  Code: ${issue.code}`);
      console.log(`  Fix:  ${issue.suggestion}`);
      console.log();
    }
  }

  console.log("=".repeat(80));
  console.log(`\nTotal: ${issues.length} issue(s) found`);
  process.exit(1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
