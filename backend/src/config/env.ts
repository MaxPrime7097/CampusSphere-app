/**
 * Environment configuration.
 *
 * Variable names deliberately mirror the Django deployment's, so the existing
 * Render dashboard configuration carries over untouched — no new keys, nothing to
 * re-enter at cutover. `SECRET_KEY` in particular keeps its name even though it is
 * now only a JWT signing secret.
 */

function str(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function bool(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function csv(name: string, fallback: string): string[] {
  return str(name, fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const isProduction = process.env.NODE_ENV === "production";

export const env = {
  isProduction,
  debug: bool("DEBUG", !isProduction),
  port: Number(str("PORT", "3000")),

  /** JWT signing secret. Same variable Django used for the same purpose. */
  secretKey: str("SECRET_KEY", isProduction ? undefined : "dev-insecure-secret-do-not-ship"),

  databaseUrl: str("DATABASE_URL", isProduction ? undefined : "postgresql://localhost:5432/campussphere"),

  /**
   * Cross-instance coordination: realtime fan-out, rate-limit counters, job
   * leadership. Optional in development, mandatory in production — see
   * assertProductionConfig().
   */
  redisUrl: process.env.REDIS_URL || null,

  /**
   * Escape hatch for the contract suite, which fires far more requests from one
   * address in a few seconds than any human would in an hour. Refused in
   * production, so it cannot be left on by accident.
   */
  rateLimitsEnabled: !bool("DISABLE_RATE_LIMITS", false),

  /**
   * Operator's declaration that this deployment runs exactly one instance.
   *
   * On one instance, Redis buys nothing: realtime fan-out, rate-limit counters and
   * job leadership are all *correct* in-process, because there is no second process
   * to disagree with. The Redis requirement exists solely to stop a silent
   * cross-instance failure, so refusing to boot a genuinely single-instance service
   * is the check being stricter than the risk.
   *
   * Setting this is an explicit statement, not a way to skip configuration. Adding a
   * second instance while it is set reintroduces exactly the bugs the check guards
   * against — chat events reaching only some clients, limits multiplied by instance
   * count, jobs running once per instance — so it must be removed *before* scaling,
   * and the server says so on every boot.
   */
  singleInstance: bool("SINGLE_INSTANCE", false),

  allowedHosts: csv("ALLOWED_HOSTS", "localhost,127.0.0.1"),
  corsAllowedOrigins: csv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:8080,https://campussphere.app,https://www.campussphere.app,https://sphera.campussphere.app",
  ),
  frontendUrl: str("FRONTEND_URL", "http://localhost:8080"),

  supabase: {
    url: process.env.SUPABASE_URL || "",
    jwtSecret: process.env.SUPABASE_JWT_SECRET || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  /**
   * SMTP. Same variable names Django used. Delivery stays off until both user and
   * password are set — Django's defaults were literal placeholders, so nothing was
   * ever configured, and no mail has ever been sent from this app.
   */
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || "587"),
    user: process.env.EMAIL_HOST_USER || "",
    password: process.env.EMAIL_HOST_PASSWORD || "",
    from: process.env.DEFAULT_FROM_EMAIL || "CampusSphere <no-reply@campussphere.app>",
  },

  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || null,
    geminiApiKey: process.env.GEMINI_API_KEY || null,
    groqApiKey: process.env.GROQ_API_KEY || null,
    bedrock: {
      accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
      region: process.env.BEDROCK_AWS_REGION || process.env.AWS_REGION || "us-east-1",
      modelId: process.env.BEDROCK_CLAUDE_MODEL_ID || process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-haiku-4-5-20251001-v1:0",
      claudeModelId: process.env.BEDROCK_CLAUDE_MODEL_ID || process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-haiku-4-5-20251001-v1:0",
      deepseekModelId: process.env.BEDROCK_DEEPSEEK_MODEL_ID || "deepseek.v3.2",
      deepseekRegion: process.env.BEDROCK_DEEPSEEK_AWS_REGION || process.env.BEDROCK_AWS_REGION || process.env.AWS_REGION || "us-east-1",
      budgetUsd: Number(process.env.BEDROCK_TOTAL_BUDGET_USD || "90"),
      safetyThresholdPercent: Number(process.env.BEDROCK_SAFETY_THRESHOLD_PERCENT || "90"),
    },
    bedrockMantle: {
      endpoint: process.env.BEDROCK_MANTLE_ENDPOINT || "https://bedrock-mantle.us-east-1.api.aws/v1",
      region: process.env.BEDROCK_MANTLE_REGION || process.env.BEDROCK_AWS_REGION || process.env.AWS_REGION || "us-east-1",
      apiKey: process.env.BEDROCK_MANTLE_API_KEY || "",
      deepseekModelId: process.env.BEDROCK_MANTLE_DEEPSEEK_MODEL_ID || "deepseek.v3.2",
      minimaxModelId: process.env.BEDROCK_MANTLE_MINIMAX_MODEL_ID || "minimax.minimax-m2.5",
      claudeModelId: process.env.BEDROCK_MANTLE_CLAUDE_MODEL_ID || "anthropic.claude-haiku-4-5",
      primaryStructured: (process.env.BEDROCK_MANTLE_PRIMARY_STRUCTURED || "deepseek").toLowerCase(),
      deepseekInputPrice: Number(process.env.BEDROCK_MANTLE_DEEPSEEK_INPUT_PRICE || "0.62") / 1_000_000,
      deepseekOutputPrice: Number(process.env.BEDROCK_MANTLE_DEEPSEEK_OUTPUT_PRICE || "1.85") / 1_000_000,
      minimaxInputPrice: Number(process.env.BEDROCK_MANTLE_MINIMAX_INPUT_PRICE || "0.30") / 1_000_000,
      minimaxOutputPrice: Number(process.env.BEDROCK_MANTLE_MINIMAX_OUTPUT_PRICE || "1.20") / 1_000_000,
      claudeInputPrice: Number(process.env.BEDROCK_MANTLE_CLAUDE_INPUT_PRICE || "1.00") / 1_000_000,
      claudeOutputPrice: Number(process.env.BEDROCK_MANTLE_CLAUDE_OUTPUT_PRICE || "5.00") / 1_000_000,
    },
    azureSpeech: {
      key: process.env.AZURE_SPEECH_KEY || "",
      region: process.env.AZURE_SPEECH_REGION || "westeurope",
    },
    tts: {
      provider: (process.env.TTS_PROVIDER || "polly").toLowerCase() as "polly" | "azure",
      pollyRegion: process.env.POLLY_AWS_REGION || process.env.AWS_REGION || "eu-west-1",
    },
  },

  storage: {
    useS3: bool("USE_S3", false),
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    bucket: process.env.AWS_STORAGE_BUCKET_NAME || "",
    region: process.env.AWS_S3_REGION_NAME || "eu-west-1",
    /** Non-AWS S3-compatible endpoint, e.g. Supabase Storage. Empty means AWS. */
    endpoint: process.env.AWS_S3_ENDPOINT_URL || "",
    /** CDN or custom domain fronting the bucket. Django called this AWS_S3_CUSTOM_DOMAIN. */
    publicUrl: process.env.AWS_S3_CUSTOM_DOMAIN || "",
  },

  /**
   * Who may list another user's connections.
   *   own_only       — only the owner
   *   public_profile — any authenticated user
   * Django defaulted to public_profile outside DEBUG; kept for parity.
   */
  connectionListVisibility: str("CONNECTION_LIST_VISIBILITY_POLICY", isProduction ? "public_profile" : "own_only"),

  /** Access 7 days, refresh 90 days — unchanged from the Django SIMPLE_JWT config. */
  jwt: {
    accessTtlSeconds: 60 * 60 * 24 * 7,
    refreshTtlSeconds: 60 * 60 * 24 * 90,
  },
} as const;

/**
 * Fail fast in production on configuration that is only safe in development.
 * Called from server.ts before the listener binds.
 */
export function assertProductionConfig(): void {
  if (!env.isProduction) return;

  const problems: string[] = [];
  if (env.secretKey.startsWith("dev-")) problems.push("SECRET_KEY is still the development default");
  if (env.debug) problems.push("DEBUG must be false in production");
  if (!env.storage.useS3) {
    // Render's free plan has no persistent disk: local uploads are destroyed on
    // every redeploy. This was already true of the Django deployment.
    problems.push("USE_S3 must be true in production — local disk is ephemeral");
  }
  if (!env.redisUrl && !env.singleInstance) {
    // Without Redis, realtime fan-out, rate limits and scheduled jobs are all
    // process-local. On one instance that is harmless — there is no second process
    // to disagree with. On several it means chat events vanish, limits multiply by
    // the instance count, and every instance runs every cron job. Fail loudly
    // rather than degrade silently, unless the operator has declared one instance.
    problems.push(
      "REDIS_URL is required in production — realtime, rate limits and jobs are cross-instance. " +
        "Set SINGLE_INSTANCE=true instead only if this service genuinely runs one instance.",
    );
  }
  if (!env.rateLimitsEnabled) problems.push("DISABLE_RATE_LIMITS must not be set in production");

  if (problems.length > 0) {
    throw new Error(`Refusing to start:\n  - ${problems.join("\n  - ")}`);
  }
}
