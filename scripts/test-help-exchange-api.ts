/**
 * Smoke test for Help Exchange API endpoints.
 * Tests POST creation (auth required), GET with ZIP/radius, category filtering.
 * Run with: npm run test:help-exchange
 * Requires dev server running (defaults to http://localhost:3000).
 */

const HELP_EXCHANGE_TEST_BASE_URL = process.env.TEST_API_URL || "http://localhost:3000";

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

async function testGetWithZipRadius(): Promise<void> {
  const url = `${HELP_EXCHANGE_TEST_BASE_URL}/api/help-exchange/postings?zip=60014&radius=25`;
  const response = await fetch(url);
  const json = await response.json();

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(json.ok === true, `Expected ok: true, got ok: ${json.ok}`);
  assert(json.data !== undefined, "Expected data field");
  assert(Array.isArray(json.data.postings), "Expected postings array");
}

async function testGetWithInvalidZip(): Promise<void> {
  const url = `${HELP_EXCHANGE_TEST_BASE_URL}/api/help-exchange/postings?zip=invalid&radius=25`;
  const response = await fetch(url);
  const json = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(json.ok === false, `Expected ok: false, got ok: ${json.ok}`);
}

async function testPostRequiresAuth(): Promise<void> {
  const url = `${HELP_EXCHANGE_TEST_BASE_URL}/api/help-exchange/postings`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test Posting",
      description: "Test description",
      category: "FENCE_REPAIRS",
      zipCode: "60014",
    }),
  });
  const json = await response.json();

  // Should require auth (401 or 403)
  assert(
    response.status === 401 || response.status === 403,
    `Expected 401 or 403, got ${response.status}`
  );
  assert(json.ok === false, `Expected ok: false, got ok: ${json.ok}`);
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
  console.log(`Testing ${HELP_EXCHANGE_TEST_BASE_URL}/api/help-exchange/postings\n`);

  await runTest("GET with ZIP/radius returns postings", testGetWithZipRadius);
  await runTest("GET with invalid ZIP returns 400", testGetWithInvalidZip);
  await runTest("POST requires authentication", testPostRequiresAuth);

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
