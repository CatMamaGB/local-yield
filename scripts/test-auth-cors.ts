/**
 * Contract tests for auth (401/403) and CORS (preflight, headers).
 * Prevents regressions in WWW-Authenticate, CORS credentials opt-in, X-Request-Id.
 * Run with: npm run test:auth-cors
 * Requires dev server running (defaults to http://localhost:3000).
 */

const TEST_BASE_URL = process.env.TEST_API_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/** Unauthenticated request to protected endpoint returns 401 with WWW-Authenticate: Bearer */
async function testUnauthenticatedProtectedReturns401(): Promise<void> {
  const response = await fetch(`${TEST_BASE_URL}/api/dashboard/profile`);
  const json = await response.json().catch(() => ({}));

  assert(response.status === 401, `Expected 401, got ${response.status}`);
  assert(json.ok === false, `Expected ok: false, got ok: ${json.ok}`);
  const wantAuth = response.headers.get("WWW-Authenticate");
  assert(
    wantAuth?.toLowerCase().includes("bearer"),
    `Expected WWW-Authenticate to include Bearer, got: ${wantAuth ?? "missing"}`
  );
}

/** Unauthenticated request to admin endpoint returns 401 */
async function testAdminWithoutAuthReturns401(): Promise<void> {
  const response = await fetch(`${TEST_BASE_URL}/api/admin/request-logs`);
  const json = await response.json().catch(() => ({}));

  assert(response.status === 401, `Expected 401, got ${response.status}`);
  assert(json.ok === false, `Expected ok: false, got ok: ${json.ok}`);
}

/** OPTIONS preflight to CORS-enabled endpoint returns 204 with CORS headers; credentials not set by default */
async function testCorsPreflight(): Promise<void> {
  const response = await fetch(`${TEST_BASE_URL}/api/products`, {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:8081" },
  });

  assert(response.status === 204, `Expected 204, got ${response.status}`);
  const allowOrigin = response.headers.get("Access-Control-Allow-Origin");
  assert(
    allowOrigin === "http://localhost:8081",
    `Expected Access-Control-Allow-Origin: http://localhost:8081, got: ${allowOrigin}`
  );
  // Bearer-only API: credentials should be opt-in, so we expect it not to be set (or not "true")
  const allowCreds = response.headers.get("Access-Control-Allow-Credentials");
  assert(
    allowCreds !== "true",
    `Expected Access-Control-Allow-Credentials not to be "true" (opt-in for Bearer-only API), got: ${allowCreds}`
  );
}

/** API response includes X-Request-Id header when requestId is used */
async function testXRequestIdHeader(): Promise<void> {
  const response = await fetch(`${TEST_BASE_URL}/api/care/caregivers?zip=60014&radius=25&category=LIVESTOCK_CARE`);
  const json = await response.json().catch(() => ({}));

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  const requestIdHeader = response.headers.get("X-Request-Id");
  assert(
    typeof requestIdHeader === "string" && requestIdHeader.length > 0,
    `Expected X-Request-Id response header, got: ${requestIdHeader ?? "missing"}`
  );
  if (json.requestId) {
    assert(
      json.requestId === requestIdHeader,
      `Expected body requestId to match X-Request-Id header`
    );
  }
}

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  try {
    await testFn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: message });
    console.error(`✗ ${name}: ${message}`);
  }
}

async function main() {
  console.log(`Testing auth & CORS at ${TEST_BASE_URL}\n`);

  await runTest("Unauthenticated protected endpoint returns 401 with WWW-Authenticate", testUnauthenticatedProtectedReturns401);
  await runTest("Admin endpoint without auth returns 401", testAdminWithoutAuthReturns401);
  await runTest("CORS preflight returns 204 and CORS headers (credentials opt-in)", testCorsPreflight);
  await runTest("Response includes X-Request-Id header", testXRequestIdHeader);

  console.log("\n--- Results ---");
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`${passed}/${total} tests passed`);

  if (passed < total) {
    console.error("\nFailed tests:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.error(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log("\nAll tests passed!");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
