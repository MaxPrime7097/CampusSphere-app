/**
 * SSO Bridge — loaded inside a hidden iframe by Sphera.
 *
 * This page checks whether the user is already authenticated on CampusSphere
 * (i.e. has an "access" token in localStorage).  If so, it silently sends the
 * tokens back to the parent window (Sphera) via postMessage.
 *
 * Security: only whitelisted Sphera origins can receive the tokens.
 */
import { useEffect } from "react";

const ALLOWED_ORIGINS = [
  "https://sphera.campussphere.app",
  "http://localhost:5174",
  "http://localhost:4173",
];

export function SSOBridge() {
  useEffect(() => {
    // Determine target origin from query param (set by Sphera) or referrer
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("origin") || "";

    const targetOrigin = ALLOWED_ORIGINS.includes(requested)
      ? requested
      : ALLOWED_ORIGINS[0];

    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    if (access) {
      window.parent.postMessage(
        { type: "cs_sso", access, refresh },
        targetOrigin,
      );
    } else {
      window.parent.postMessage({ type: "cs_sso_none" }, targetOrigin);
    }
  }, []);

  // Nothing to render — this component lives inside a hidden iframe.
  return null;
}
