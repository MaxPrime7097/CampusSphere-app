import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Two kinds of test, deliberately distinguished:
    //   *.contract.test.ts — black-box HTTP. Imports no application code, so the
    //                        same files run against either backend.
    //   *.unit.test.ts     — pure functions only (prompt building, JSON recovery,
    //                        counting). These exist because the Sphera defects they
    //                        cover are otherwise only observable through a live AI
    //                        provider, and a missing API key would leave the most
    //                        important fixes in the migration unverified.
    include: ["tests/**/*.contract.test.ts", "tests/**/*.unit.test.ts"],
    // Contract tests talk to a real server over HTTP. Budget is dominated by
    // round-trip latency to a remote database, not by the server: a test that
    // registers two users and exercises a flow makes a dozen sequential hops and
    // routinely lands in the 20-30s range. 30s proved too tight and produced
    // spurious timeouts, so this is deliberately generous.
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Fixtures are created through the API and are independent, but running files
    // in parallel against one server makes failures harder to read.
    fileParallelism: false,
    reporters: ["default"],
  },
});
