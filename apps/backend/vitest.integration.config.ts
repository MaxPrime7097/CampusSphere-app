import { defineConfig } from "vitest/config";

/**
 * Integration suite — separate from the contract suite on purpose.
 *
 * These tests boot their own server with an environment the contract suite cannot
 * use (rate limits on, SMTP captured) and may reach the database directly to set up
 * state that has no API, such as promoting a user to staff. That breaks the
 * contract suite's defining property — black box, no application imports — so it
 * gets its own config and its own command rather than diluting it.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/integration/**/*.integration.test.ts"],
    // One server, one set of rate-limit buckets: these must not race each other.
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 120_000,
    hookTimeout: 180_000,
    reporters: ["default"],
  },
});
