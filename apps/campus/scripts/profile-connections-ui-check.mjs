import fs from "node:fs";
import path from "node:path";

const profileFilePath = path.resolve(process.cwd(), "src/pages/Profile.tsx");
const connectionsTabPath = path.resolve(
  process.cwd(),
  "src/components/profile/ProfileConnectionsTab.tsx"
);

const profileFile = fs.existsSync(profileFilePath)
  ? fs.readFileSync(profileFilePath, "utf8")
  : "";
const connectionsTabFile = fs.existsSync(connectionsTabPath)
  ? fs.readFileSync(connectionsTabPath, "utf8")
  : "";
const combinedContent = `${profileFile}\n${connectionsTabFile}`;

const mappingChecks = [
  "isRequesterTarget",
  "name:",
  "username:",
  "avatar:",
];

const missingMappingChecks = mappingChecks.filter(
  (check) => !combinedContent.includes(check)
);
if (missingMappingChecks.length > 0) {
  console.error(
    `Profile connection mapping is missing expected requester/recipient-aware serializer usage: ${missingMappingChecks.join(", ")}`
  );
  process.exit(1);
}

const connectionCardChecks = [
  "<AvatarImage src={connection.avatar} />",
  '<p className="font-semibold truncate">{connection.name}</p>',
  '<p className="text-sm text-muted-foreground truncate">@{connection.username}</p>',
];

const missingCardChecks = connectionCardChecks.filter(
  (check) =>
    !connectionsTabFile.includes(check) && !profileFile.includes(check)
);
if (missingCardChecks.length > 0) {
  console.error(
    `Profile connection card UI is missing expected serializer-backed fields: ${missingCardChecks.join(", ")}`
  );
  process.exit(1);
}

console.log("Profile connection UI checks passed.");
