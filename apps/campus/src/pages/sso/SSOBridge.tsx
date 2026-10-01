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
import { sendSsoTokens, sendSsoNone, isAllowedSpheraOrigin, SPHERA_ORIGINS } from "@cs/sso";

export function SSOBridge(): null {
  useEffect(() => {
    // Determine target origin from query param (set by Sphera) or referrer
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("origin") || "";

    const targetOrigin = isAllowedSpheraOrigin(requested)
      ? requested
      : SPHERA_ORIGINS[0];

    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    if (access) {
      sendSsoTokens(window.parent, targetOrigin, { access, refresh });
    } else {
      sendSsoNone(window.parent, targetOrigin);
    }
  }, []);

  // Nothing to render — this component lives inside a hidden iframe.
  return null;
}

