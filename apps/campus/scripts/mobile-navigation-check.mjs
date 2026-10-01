import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src");
const appFile = fs.readFileSync(path.join(root, "App.tsx"), "utf8");
const navConfigFile = fs.readFileSync(
  path.join(root, "components/layout/navigationConfig.ts"),
  "utf8"
);

const appRoutes = [...appFile.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const mobileRouteLiterals = [...navConfigFile.matchAll(/title:\s*"[^"]+",\s*url:\s*"([^"]+)"/g)].map((m) => m[1]);

const requiredMobileRoutes = ["/", "/resources", "/spheres", "/messages", "/saved", "/settings"];
const missingRequired = requiredMobileRoutes.filter((route) => !mobileRouteLiterals.includes(route));
const missingInApp = requiredMobileRoutes.filter((route) => !appRoutes.includes(route));

const hasRoleGating = navConfigFile.includes("isAdminUser") && navConfigFile.includes("...adminEntry");
const hasAdminRoute = appRoutes.includes("/cs-inc/private/admin");

if (missingRequired.length > 0) {
  console.error(`Missing required mobile routes in navigation config: ${missingRequired.join(", ")}`);
  process.exit(1);
}

if (missingInApp.length > 0) {
  console.error(`Missing required mobile routes in App router: ${missingInApp.join(", ")}`);
  process.exit(1);
}

if (!hasRoleGating || !hasAdminRoute) {
  console.error("Admin route gating check failed: expected role-gated mobile admin route wiring.");
  process.exit(1);
}

console.log("Mobile navigation checks passed.");
