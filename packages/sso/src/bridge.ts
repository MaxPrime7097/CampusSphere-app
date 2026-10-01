import {
  SSO_MESSAGE_TYPE,
  SSO_NONE_TYPE,
  CAMPUS_ORIGINS,
  SPHERA_ORIGINS,
  isAllowedSpheraOrigin,
  isAllowedCampusOrigin,
} from "./constants";

export interface SsoTokensMessage {
  type: typeof SSO_MESSAGE_TYPE;
  access: string;
  refresh?: string | null;
}

export interface SsoNoneMessage {
  type: typeof SSO_NONE_TYPE;
}

export type SsoMessage = SsoTokensMessage | SsoNoneMessage;

export function sendSsoTokens(
  targetWindow: Window,
  targetOrigin: string,
  tokens: { access: string; refresh?: string | null }
): void {
  const safeOrigin = isAllowedSpheraOrigin(targetOrigin) ? targetOrigin : SPHERA_ORIGINS[0];
  targetWindow.postMessage(
    {
      type: SSO_MESSAGE_TYPE,
      access: tokens.access,
      refresh: tokens.refresh || null,
    },
    safeOrigin
  );
}

export function sendSsoNone(targetWindow: Window, targetOrigin: string): void {
  const safeOrigin = isAllowedSpheraOrigin(targetOrigin) ? targetOrigin : SPHERA_ORIGINS[0];
  targetWindow.postMessage({ type: SSO_NONE_TYPE }, safeOrigin);
}

export function attemptSilentSso(): Promise<{ access: string; refresh: string } | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(null);
      return;
    }

    const isLocal = ["localhost", "127.0.0.1"].some((h) => window.location.hostname.includes(h));
    const myOrigin = window.location.origin;
    const bridgeUrl = isLocal
      ? `http://localhost:5173/sso/bridge?origin=${encodeURIComponent(myOrigin)}`
      : `https://campussphere.app/sso/bridge?origin=${encodeURIComponent(myOrigin)}`

    let settled = false;
    const iframe = document.createElement("iframe");
    iframe.src = bridgeUrl;
    iframe.style.display = "none";

    const cleanup = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", handler);
      clearTimeout(timer);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    const handler = (e: MessageEvent) => {
      if (!isAllowedCampusOrigin(e.origin)) return;
      if (e.data?.type === SSO_MESSAGE_TYPE && e.data.access) {
        cleanup();
        resolve({ access: e.data.access, refresh: e.data.refresh || "" });
      } else if (e.data?.type === SSO_NONE_TYPE) {
        cleanup();
        resolve(null);
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 4000);

    window.addEventListener("message", handler);
    document.body.appendChild(iframe);
  });
}

export function openSsoPopup(): Promise<{ access: string; refresh: string } | null> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    const isLocal = ["localhost", "127.0.0.1"].some((h) => window.location.hostname.includes(h));
    const myOrigin = window.location.origin;
    const popupUrl = isLocal
      ? `http://localhost:5173/sso/popup?origin=${encodeURIComponent(myOrigin)}`
      : `https://campussphere.app/sso/popup?origin=${encodeURIComponent(myOrigin)}`;

    const w = 420;
    const h = 540;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;

    const popup = window.open(
      popupUrl,
      "cs_sso_popup",
      `width=${w},height=${h},left=${left},top=${top},resizable=no,scrollbars=no`
    );

    if (!popup) {
      reject(new Error("Popup bloquée par le navigateur"));
      return;
    }

    let settled = false;
    // eslint-disable-next-line prefer-const
    let checkClosed: ReturnType<typeof setInterval>;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", handler);
      if (checkClosed) clearInterval(checkClosed);
    };

    const handler = (e: MessageEvent) => {
      if (!isAllowedCampusOrigin(e.origin)) return;
      if (e.data?.type === SSO_MESSAGE_TYPE && e.data.access) {
        cleanup();
        resolve({ access: e.data.access, refresh: e.data.refresh || "" });
      }
    };

    checkClosed = setInterval(() => {
      if (popup && popup.closed) {
        cleanup();
        resolve(null);
      }
    }, 500);

    window.addEventListener("message", handler);
  });
}

