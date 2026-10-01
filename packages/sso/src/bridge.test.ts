import { describe, it, expect, vi } from "vitest";
import {
  isAllowedSpheraOrigin,
  isAllowedCampusOrigin,
  sendSsoTokens,
  sendSsoNone,
  SSO_MESSAGE_TYPE,
  SSO_NONE_TYPE,
  SPHERA_ORIGINS,
} from "./index";

describe("@cs/sso security & bridge", () => {
  describe("isAllowedSpheraOrigin", () => {
    it("should allow legitimate Sphera production domain", () => {
      expect(isAllowedSpheraOrigin("https://sphera.campussphere.app")).toBe(true);
    });

    it("should allow local development ports", () => {
      expect(isAllowedSpheraOrigin("http://localhost:5174")).toBe(true);
      expect(isAllowedSpheraOrigin("http://localhost:4173")).toBe(true);
    });

    it("should reject malicious or unapproved domains", () => {
      expect(isAllowedSpheraOrigin("https://evil.com")).toBe(false);
      expect(isAllowedSpheraOrigin("https://sphera.campussphere.app.evil.com")).toBe(false);
      expect(isAllowedSpheraOrigin("")).toBe(false);
    });
  });

  describe("isAllowedCampusOrigin", () => {
    it("should allow legitimate CampusSphere domain", () => {
      expect(isAllowedCampusOrigin("https://campussphere.app")).toBe(true);
      expect(isAllowedCampusOrigin("https://www.campussphere.app")).toBe(true);
    });

    it("should allow local development port 5173", () => {
      expect(isAllowedCampusOrigin("http://localhost:5173")).toBe(true);
    });

    it("should reject malicious domains", () => {
      expect(isAllowedCampusOrigin("https://phishing.com")).toBe(false);
      expect(isAllowedCampusOrigin("")).toBe(false);
    });
  });

  describe("sendSsoTokens", () => {
    it("should postMessage with cs_sso type and tokens to safe origin", () => {
      const mockPostMessage = vi.fn();
      const mockWindow = { postMessage: mockPostMessage } as unknown as Window;

      sendSsoTokens(mockWindow, "https://sphera.campussphere.app", {
        access: "jwt-access-token",
        refresh: "jwt-refresh-token",
      });

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          type: SSO_MESSAGE_TYPE,
          access: "jwt-access-token",
          refresh: "jwt-refresh-token",
        },
        "https://sphera.campussphere.app"
      );
    });

    it("should fall back to safe default origin if unapproved origin is passed", () => {
      const mockPostMessage = vi.fn();
      const mockWindow = { postMessage: mockPostMessage } as unknown as Window;

      sendSsoTokens(mockWindow, "https://malicious.com", {
        access: "secret-token",
      });

      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          type: SSO_MESSAGE_TYPE,
          access: "secret-token",
          refresh: null,
        },
        SPHERA_ORIGINS[0]
      );
    });
  });

  describe("sendSsoNone", () => {
    it("should postMessage with cs_sso_none type", () => {
      const mockPostMessage = vi.fn();
      const mockWindow = { postMessage: mockPostMessage } as unknown as Window;

      sendSsoNone(mockWindow, "https://sphera.campussphere.app");

      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: SSO_NONE_TYPE },
        "https://sphera.campussphere.app"
      );
    });
  });
});
