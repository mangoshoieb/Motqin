import { ASSISTANT_PERMISSIONS_FALLBACK } from "../constants/tracking-table.constants";
import { AssistantPermission, AssistantPermissionItem } from "../types/tracking-table.types";

// Arabic names of the assistant permissions, for places outside React (the
// assistant_permission_missing toast). Starts from the guide's copy and is
// replaced by GET /lookups/assistant-permissions once that has loaded.
let names = new Map<string, string>(
  ASSISTANT_PERMISSIONS_FALLBACK.map((item) => [item.key, item.nameAr]),
);

export function setAssistantPermissions(items: AssistantPermissionItem[]) {
  if (items.length) names = new Map(items.map((item) => [item.key, item.nameAr]));
}

export const assistantPermissionName = (key: AssistantPermission | string) => names.get(key) ?? key;
