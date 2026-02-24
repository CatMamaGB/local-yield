/**
 * Contract test for GET /api/care/caregivers
 * Prevents regressions like "search echo missing" or "ok shape changed".
 * Run with: npm run test:caregivers
 * Requires dev server running (defaults to http://localhost:3000).
 */

const CAREGIVERS_TEST_BASE_URL = process.env.TEST_API_URL || "http://localhost:3000";

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

async function testValidRequest(): Promise<void> {
  const url = `${CAREGIVERS_TEST_BASE_URL}/api/care/caregivers?zip=60014&radius=25&category=LIVESTOCK_CARE`;
  const response = await fetch(url);
  const json = await response.json();

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(json.ok === true, `Expected ok: true, got ok: ${json.ok}`);
  assert(json.data !== undefined, "Expected data field");
  assert(Array.isArray(json.data.caregivers), "Expected caregivers array");
  assert(json.data.search !== undefined, "Expected search field");
  assert(json.data.search.zip === "60014", `Expected search.zip to be "60014", got "${json.data.search.zip}"`);
  assert(json.data.search.radius === 25, `Expected search.radius to be 25, got ${json.data.search.radius}`);
  assert(json.data.search.category === "LIVESTOCK_CARE", `Expected search.category to be "LIVESTOCK_CARE", got "${json.data.search.category}"`);
}

async function testInvalidCategory(): Promise<void> {
  const url = `${CAREGIVERS_TEST_BASE_URL}/api/care/caregivers?zip=60014&radius=25&category=INVALID`;
  const response = await fetch(url);
  const json = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(json.ok === false, `Expected ok: false, got ok: ${json.ok}`);
  assert(json.error !== undefined, "Expected error field");
  assert(json.error.code === "INVALID_CATEGORY", `Expected error.code to be "INVALID_CATEGORY", got "${json.error.code}"`);
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
  console.log(`Testing ${CAREGIVERS_TEST_BASE_URL}/api/care/caregivers\n`);

  await runTest("Valid request with category", testValidRequest);
  await runTest("Invalid category returns 400", testInvalidCategory);

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
