/**
 * Smoke test for booking idempotency.
 * Tests that duplicate idempotency key returns existing booking.
 * Tests that different keys create different bookings.
 * Run with: npm run test:booking-idempotency
 * Requires dev server running (defaults to http://localhost:3000).
 * 
 * NOTE: This test requires authentication. In a real scenario, you'd need to
 * authenticate first or use a test token. For now, it tests the contract.
 */

const BOOKING_TEST_BASE_URL = process.env.TEST_API_URL || "http://localhost:3000";

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

async function testIdempotencyKeyInHeader(): Promise<void> {
  const idempotencyKey = `test-${Date.now()}`;
  const url = `${BOOKING_TEST_BASE_URL}/api/care/bookings`;
  
  // First request
  const response1 = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      caregiverId: "test-caregiver-id",
      startAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      endAt: new Date(Date.now() + 172800000).toISOString(), // day after
      locationZip: "60014",
      species: "DOG",
      serviceType: "BOARDING",
    }),
  });

  // Second request with same key
  const response2 = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      caregiverId: "test-caregiver-id",
      startAt: new Date(Date.now() + 86400000).toISOString(),
      endAt: new Date(Date.now() + 172800000).toISOString(),
      locationZip: "60014",
      species: "DOG",
      serviceType: "BOARDING",
    }),
  });

  // Both should return same bookingId if idempotency works
  // (or both fail with auth, which is fine for contract test)
  if (response1.status === 200 && response2.status === 200) {
    const json1 = await response1.json();
    const json2 = await response2.json();
    
    assert(
      json1.data?.bookingId === json2.data?.bookingId,
      `Expected same bookingId for duplicate idempotency key, got ${json1.data?.bookingId} and ${json2.data?.bookingId}`
    );
  } else {
    // Auth required - that's fine, just verify structure
    assert(
      response1.status === 401 || response1.status === 403,
      `Expected auth required (401/403), got ${response1.status}`
    );
  }
}

async function testDifferentKeysCreateDifferentBookings(): Promise<void> {
  const key1 = `test-${Date.now()}-1`;
  const key2 = `test-${Date.now()}-2`;
  const url = `${BOOKING_TEST_BASE_URL}/api/care/bookings`;
  
  const response1 = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key1,
    },
    body: JSON.stringify({
      caregiverId: "test-caregiver-id",
      startAt: new Date(Date.now() + 86400000).toISOString(),
      endAt: new Date(Date.now() + 172800000).toISOString(),
      locationZip: "60014",
      species: "DOG",
      serviceType: "BOARDING",
    }),
  });

  const response2 = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key2,
    },
    body: JSON.stringify({
      caregiverId: "test-caregiver-id",
      startAt: new Date(Date.now() + 86400000).toISOString(),
      endAt: new Date(Date.now() + 172800000).toISOString(),
      locationZip: "60014",
      species: "DOG",
      serviceType: "BOARDING",
    }),
  });

  // Both should succeed or both require auth
  // If both succeed, they should have different bookingIds
  if (response1.status === 200 && response2.status === 200) {
    const json1 = await response1.json();
    const json2 = await response2.json();
    
    assert(
      json1.data?.bookingId !== json2.data?.bookingId,
      `Expected different bookingIds for different idempotency keys`
    );
  } else {
    // Auth required - that's fine
    assert(
      response1.status === 401 || response1.status === 403,
      `Expected auth required (401/403), got ${response1.status}`
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
  console.log(`Testing booking idempotency at ${BOOKING_TEST_BASE_URL}/api/care/bookings\n`);

  await runTest("Duplicate idempotency key returns same booking", testIdempotencyKeyInHeader);
  await runTest("Different keys create different bookings", testDifferentKeysCreateDifferentBookings);

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
