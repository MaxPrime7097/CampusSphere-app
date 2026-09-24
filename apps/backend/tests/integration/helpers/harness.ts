/**
 * Integration harness.
 *
 * Boots a real server as a child process with an environment the contract suite
 * cannot use — rate limits **enabled**, SMTP pointed at a fake inbox — so the
 * defects that live in *wiring* rather than in logic can actually be observed.
 *
 * The contract suite deliberately runs with `DISABLE_RATE_LIMITS=1` (it fires more
 * requests from one address in seconds than the anonymous limit allows in an hour),
 * which means it structurally cannot prove that throttling is connected. That is
 * precisely the shape of the Django defect: the throttle class existed, was
 * referenced by three views, and never ran.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import net from "node:net";
import { setTimeout as sleep } from "node:timers/promises";
import { Redis } from "ioredis";

/**
 * Load `.env` into this process.
 *
 * The server child gets `--env-file-if-exists=.env` of its own, but the *test*
 * process needs DATABASE_URL and REDIS_URL too — to reset rate-limit counters and
 * to reach the database directly. Relying on the invoking shell having sourced
 * `.env` makes the suite pass or fail depending on how it was launched, which is
 * how it behaved before this: green when run from a shell that happened to have it.
 *
 * Existing variables win, so an explicit override on the command line still works.
 */
function loadDotEnv(path: string): void {
  let contents: string;
  try {
    contents = readFileSync(path, "utf8");
  } catch {
    return; // No .env is legitimate when everything is set externally.
  }

  for (const line of contents.split("\n")) {
    const match = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.trim().replace(/^(['"])(.*)\1$/, "$2");
  }
}

export const INTEGRATION_PORT = 3100;
export const SMTP_PORT = 3125;
export const BASE_URL = `http://127.0.0.1:${INTEGRATION_PORT}`;

const PROJECT_ROOT_URL = new URL("../../../", import.meta.url);
loadDotEnv(`${PROJECT_ROOT_URL.pathname}.env`);

// ── Rate-limit isolation ────────────────────────────────────────────────────

/**
 * Rate-limit counters survive between runs, so without this the suite passes once
 * and then fails for an hour — it exhausts the very limits it exists to test.
 *
 * Clearing counters is test isolation, not weakening: the limiter is still fully
 * enabled, and every throttle assertion still has to earn its 429 from a cold
 * bucket inside the test that makes the claim.
 *
 * Requires Redis. Without it the server keeps counters in-process where the suite
 * cannot reach them, and the throttle tests would be unreliable rather than wrong —
 * which is worse, so this refuses instead.
 */
export async function flushRateLimits(pattern = "cs:rl:*"): Promise<void> {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "The integration suite needs REDIS_URL so it can reset rate-limit counters between runs. " +
        "Start redis (redis-server --port 6379) and set REDIS_URL=redis://127.0.0.1:6379.",
    );
  }

  const redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
  try {
    await redis.connect();
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 500);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== "0");
  } finally {
    redis.disconnect();
  }
}

/**
 * The global anonymous limit (60/hour/IP) is unrelated to what these tests assert
 * and would otherwise fire first — every registration and every failed login is an
 * anonymous request, and one run makes more than sixty of them. Cleared before each
 * test so the 429 that arrives is the one under test.
 */
export const flushAnonymousLimit = () => flushRateLimits("cs:rl:anon:*");

// ── Fake SMTP inbox ─────────────────────────────────────────────────────────

export interface CapturedMail {
  from: string;
  to: string[];
  data: string;
}

/**
 * Minimal SMTP server: enough of the protocol for nodemailer to complete a
 * delivery, and nothing more.
 *
 * AUTH is deliberately not advertised. Nodemailer skips authentication when the
 * server does not offer it, which avoids negotiating credentials in clear text
 * just to test that a message is composed and sent.
 */
export function startFakeSmtp(inbox: CapturedMail[]): Promise<net.Server> {
  const server = net.createServer((socket) => {
    let stage: "commands" | "body" = "commands";
    let buffer = "";
    let current: CapturedMail = { from: "", to: [], data: "" };

    socket.write("220 fake-smtp ready\r\n");

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");

      // SMTP is line-oriented; process whole lines only.
      let index: number;
      while ((index = buffer.indexOf("\r\n")) !== -1) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);

        if (stage === "body") {
          if (line === ".") {
            inbox.push(current);
            current = { from: "", to: [], data: "" };
            stage = "commands";
            socket.write("250 OK queued\r\n");
          } else {
            current.data += `${line}\n`;
          }
          continue;
        }

        const upper = line.toUpperCase();
        if (upper.startsWith("EHLO") || upper.startsWith("HELO")) {
          socket.write("250-fake-smtp\r\n250 8BITMIME\r\n");
        } else if (upper.startsWith("MAIL FROM")) {
          current.from = line.slice(line.indexOf(":") + 1).trim();
          socket.write("250 OK\r\n");
        } else if (upper.startsWith("RCPT TO")) {
          current.to.push(line.slice(line.indexOf(":") + 1).trim());
          socket.write("250 OK\r\n");
        } else if (upper.startsWith("DATA")) {
          stage = "body";
          socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
        } else if (upper.startsWith("QUIT")) {
          socket.write("221 Bye\r\n");
          socket.end();
        } else {
          socket.write("250 OK\r\n");
        }
      }
    });

    socket.on("error", () => undefined);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(SMTP_PORT, "127.0.0.1", () => resolve(server));
  });
}

// ── Server under test ───────────────────────────────────────────────────────

let child: ChildProcess | null = null;

const PROJECT_ROOT = PROJECT_ROOT_URL.pathname;

export async function startServer(): Promise<void> {
  /**
   * Refuse to run against a server this harness did not start.
   *
   * A leftover process would answer the health check below and the suite would pass
   * happily against stale code — a false green, which is worse than a failure.
   */
  if (await portInUse(INTEGRATION_PORT)) {
    throw new Error(
      `port ${INTEGRATION_PORT} is already in use. A previous integration run may have leaked a ` +
        `server; kill it (lsof -ti:${INTEGRATION_PORT} | xargs kill -9) and re-run.`,
    );
  }

  /**
   * The tsx binary is invoked directly rather than through `npx`, and the child is
   * detached so it becomes its own process group.
   *
   * Both matter for teardown. `npx` spawns node as a *child*, so signalling npx
   * orphans the server and leaves the port bound. Owning the group lets
   * stopServer() signal the whole tree.
   */
  child = spawn(`${PROJECT_ROOT}node_modules/.bin/tsx`, ["--env-file-if-exists=.env", "src/server.ts"], {
    cwd: PROJECT_ROOT,
    detached: true,
    env: {
      ...process.env,
      PORT: String(INTEGRATION_PORT),
      // The point of this harness: limits ON.
      DISABLE_RATE_LIMITS: "",
      // Deliver to the fake inbox rather than Gmail.
      EMAIL_HOST: "127.0.0.1",
      EMAIL_PORT: String(SMTP_PORT),
      EMAIL_HOST_USER: "integration@campussphere.test",
      EMAIL_HOST_PASSWORD: "integration-password",
      DEFAULT_FROM_EMAIL: "CampusSphere <no-reply@campussphere.test>",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const logs: string[] = [];
  child.stdout?.on("data", (d: Buffer) => logs.push(d.toString()));
  child.stderr?.on("data", (d: Buffer) => logs.push(d.toString()));

  child.once("exit", (code) => {
    if (code !== 0 && code !== null) logs.push(`\n[harness] server exited with code ${code}`);
  });

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const res = await fetch(`${BASE_URL}/api/health/`);
      if (res.ok) return;
    } catch {
      // not listening yet
    }
    await sleep(500);
  }

  throw new Error(`integration server did not become healthy:\n${logs.join("")}`);
}

export async function stopServer(): Promise<void> {
  if (!child?.pid) return;
  const { pid } = child;
  child = null;

  // Negative pid signals the whole process group, which is why the child was
  // spawned detached. Falls back to the single process if the group is already gone.
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // Already exited.
    }
  }

  // Confirm the port is actually free before returning, so a following run cannot
  // race a dying process and bind-fail.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (!(await portInUse(INTEGRATION_PORT))) return;
    await sleep(100);
  }
  throw new Error(`integration server did not release port ${INTEGRATION_PORT}`);
}

/** True when something is already listening. */
function portInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net
      .createConnection({ port, host: "127.0.0.1" })
      .on("connect", () => {
        probe.destroy();
        resolve(true);
      })
      .on("error", () => resolve(false));
  });
}

// ── HTTP ────────────────────────────────────────────────────────────────────

export interface Res<T = any> {
  status: number;
  body: T;
  headers: Headers;
}

/**
 * Requests carry their own deadline.
 *
 * `fetch` has no default timeout, so a stalled request — a serverless database
 * resuming, most often — hangs until the *test* times out. That reports as a
 * 120-second failure with no indication of which call stalled, which is nearly
 * useless. 30s is far longer than any endpoint here legitimately takes.
 */
const REQUEST_TIMEOUT_MS = 30_000;

export async function api<T = any>(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
): Promise<Res<T>> {
  const { method = "GET", token, body } = options;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${path.replace(/^\//, "")}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`${method} ${path} did not respond within ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed as T, headers: res.headers };
}

let counter = 0;
const runId = Date.now().toString(36);
export const unique = (prefix = "i") => `${prefix}${runId}${(counter += 1)}`;

export interface TestUser {
  id: number;
  email: string;
  password: string;
  token: string;
  /** Refresh token, so the journey can exercise expiry and revocation. */
  refresh: string;
}

export async function createUser(): Promise<TestUser> {
  const username = unique("user");
  const email = `${username}@integration.test`;
  const password = "Integration!2026";

  const res = await api("api/users/auth/register/", {
    method: "POST",
    body: {
      username,
      email,
      password,
      confirm_password: password,
      first_name: "Integration",
      last_name: "Test",
    },
  });

  if (res.status !== 201) {
    throw new Error(`createUser failed (${res.status}): ${JSON.stringify(res.body).slice(0, 300)}`);
  }
  return {
    id: res.body.data.user.id,
    email,
    password,
    token: res.body.data.tokens.accessToken,
    refresh: res.body.data.tokens.refreshToken,
  };
}
