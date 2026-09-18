// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  translateError,
  parseBackendError,
  formatUserErrorMessage,
  isRateLimitOrQuotaError,
} from "./errorUtils";

describe("errorUtils", () => {
  it("translates raw RATE_LIMIT slug into clear French explanation", () => {
    const res = translateError("RATE_LIMIT");
    expect(res).toContain("Trop de requêtes envoyées");
  });

  it("translates weekly_limit_reached into weekly quota explanation", () => {
    const res = translateError("weekly_limit_reached");
    expect(res).toContain("Limite hebdomadaire atteinte");
    expect(res).toContain("5 générations Sphera gratuites");
    expect(res).toContain("lundi prochain");
  });

  it("translates insufficient_quota into clear message", () => {
    const res = translateError("insufficient_quota");
    expect(res).toContain("Quota insuffisant");
  });

  it("translates throttled with seconds", () => {
    const res = translateError("Request was throttled. Expected available in 42 seconds.", 429);
    expect(res).toContain("42 seconde(s)");
  });

  it("translates 413 payload too large", () => {
    const res = translateError("Payload Too Large", 413);
    expect(res).toContain("trop volumineux");
    expect(res).toContain("20 Mo");
  });

  it("translates 415 unsupported format", () => {
    const res = translateError("unsupported_media_type", 415);
    expect(res).toContain("Format de document non supporté");
  });

  it("translates 503 AI provider outage", () => {
    const res = translateError("AllProvidersFailedError: Bedrock Claude returned 503", 503);
    expect(res).toContain("intelligence artificielle Sphera est temporairement surchargé");
  });

  it("translates network errors like Failed to fetch", () => {
    const res = translateError("Failed to fetch");
    expect(res).toContain("Impossible de joindre les serveurs");
    expect(res).toContain("connexion Internet");
  });

  it("parses backend envelope with weekly_limit_reached and message", () => {
    const payload = {
      success: false,
      error: "weekly_limit_reached",
      message: "Tu as utilisé tes 5 générations Sphera cette semaine. Ça revient lundi prochain !",
      resetsOn: "2026-09-22T00:00:00Z",
    };
    const msg = parseBackendError(payload, 429);
    expect(msg).toContain("Limite hebdomadaire atteinte");
  });

  it("parses backend field errors with translated field names", () => {
    const payload = {
      success: false,
      error: "Validation failed.",
      field_errors: {
        email: ["This field is required."],
        password: ["Too short"],
      },
    };
    const msg = parseBackendError(payload, 400);
    expect(msg).toContain("Adresse email : Ce champ est obligatoire");
    expect(msg).toContain("Mot de passe");
  });

  it("correctly identifies rate limit or quota errors", () => {
    expect(isRateLimitOrQuotaError(new Error("RATE_LIMIT"))).toBe(true);
    expect(isRateLimitOrQuotaError({ status: 429 })).toBe(true);
    expect(isRateLimitOrQuotaError("insufficient_quota")).toBe(true);
    expect(isRateLimitOrQuotaError(new Error("Simple syntax error"))).toBe(false);
  });

  it("formats arbitrary error object through formatUserErrorMessage", () => {
    expect(formatUserErrorMessage(new Error("RATE_LIMIT"))).toContain("Trop de requêtes");
    expect(formatUserErrorMessage({ response: { status: 429, data: { error: "throttled" } } })).toContain("Trop de requêtes");
  });
});
