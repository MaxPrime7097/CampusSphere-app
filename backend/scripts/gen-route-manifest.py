#!/usr/bin/env python3
"""Regenerate tests/contract/routes.manifest.ts from documentation/API_INVENTORY.md.

The inventory is the single source of truth for which routes exist and what status
they carry. The manifest drives the generic conformance sweep, so the two can never
drift: change the inventory, re-run this, and the sweep covers the new surface.

Run from the repository root:
    python3 backend/scripts/gen-route-manifest.py
"""
import re
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
INVENTORY = ROOT / "documentation" / "API_INVENTORY.md"
MANIFEST = ROOT / "backend" / "tests" / "contract" / "routes.manifest.ts"

# Routes legitimately reachable without an Authorization header.
# Routes reachable without an Authorization header.
#
# `api/auth/supabase/debug/` is deliberately NOT here, unlike in Django. It reports
# which Supabase secrets are configured and echoes the JWKS key set to any anonymous
# caller — a free reconnaissance endpoint. It is admin-gated in the Node backend and
# is therefore expected to 401 without a token.
PUBLIC = {
    "api/auth/refresh/", "api/auth/supabase/exchange/",
    "api/health/", "api/info/", "api/users/auth/register/", "api/users/auth/login/",
    "api/users/auth/me/", "api/users/auth/password-reset/", "api/users/check-availability/",
    "api/users/contact/", "api/users/<var>/", "api/users/by-username/<var>/",
    "api/sphera/guest/generate/", "api/resources/", "api/resources/<var>/",
    "api/resources/<var>/download/", "api/resources/<var>/preview/",
    "api/resources/<var>/share/", "api/posts/", "api/posts/<var>/",
    "api/users/auth/supabase/exchange-token/",
}

ROW = re.compile(r"^\|\s*`([^`]+)`\s*\|\s*([A-Z,]+)\s*\|\s*`(\w+)`\s*\|\s*([^|]*)\|")


def main() -> int:
    rows = []
    for line in INVENTORY.read_text(encoding="utf-8").splitlines():
        m = ROW.match(line)
        if m:
            route, methods, status, _callers = m.groups()
            rows.append((route, methods.split(","), status))

    if not rows:
        print("ERROR: parsed 0 routes from the inventory table", file=sys.stderr)
        return 1

    admin = {r for r, _, _ in rows if r.startswith("api/admin/") or "admin/contact-messages" in r}

    lines = [
        "// GENERATED from documentation/API_INVENTORY.md — do not edit by hand.",
        "// Regenerate with: python3 backend/scripts/gen-route-manifest.py",
        "",
        'export type RouteStatus = "ACTIVE" | "UNUSED" | "DEPRECATED" | "INFRA";',
        "",
        "export interface RouteSpec {",
        "  /** Path template; `<var>` marks a path parameter. */",
        "  path: string;",
        "  methods: string[];",
        "  status: RouteStatus;",
        "  /** True when the route must be reachable without an Authorization header. */",
        "  public: boolean;",
        "  /** True when the route requires platform-admin privileges. */",
        "  admin: boolean;",
        "}",
        "",
        "export const ROUTES: RouteSpec[] = [",
    ]
    for route, methods, status in rows:
        ms = ", ".join(f'"{m}"' for m in methods)
        lines.append(
            f'  {{ path: "{route}", methods: [{ms}], status: "{status}", '
            f"public: {str(route in PUBLIC).lower()}, admin: {str(route in admin).lower()} }},"
        )
    lines += ["];", "", f"export const TOTAL_ROUTES = {len(rows)};", ""]

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(rows)} routes -> {MANIFEST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
