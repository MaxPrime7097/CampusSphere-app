import fs from "node:fs";
import path from "node:path";

const profileFilePath = path.resolve(process.cwd(), "src/pages/Profile.tsx");
const profileFile = fs.readFileSync(profileFilePath, "utf8");

const mappingChecks = [
  "const isRequesterProfileOwner",
  "const otherUserInfo = isRequesterProfileOwner ? conn.recipient_info : conn.requester_info",
  "name: otherUserInfo?.full_name || otherUserInfo?.name",
  "username: otherUserInfo?.username",
  "avatar: otherUserInfo?.avatar",
];

const missingMappingChecks = mappingChecks.filter((check) => !profileFile.includes(check));
if (missingMappingChecks.length > 0) {
  console.error(
    `Profile connection mapping is missing expected requester/recipient-aware serializer usage: ${missingMappingChecks.join(", ")}`
  );
  process.exit(1);
}

const connectionCardChecks = [
  "<AvatarImage src={connection.avatar} />",
  "<p className=\"font-semibold\">{connection.name}</p>",
  "<p className=\"text-sm text-muted-foreground\">@{connection.username}</p>",
];

const missingCardChecks = connectionCardChecks.filter((check) => !profileFile.includes(check));
if (missingCardChecks.length > 0) {
  console.error(
    `Profile connection card UI is missing expected serializer-backed fields: ${missingCardChecks.join(", ")}`
  );
  process.exit(1);
}

console.log("Profile connection UI checks passed.");
