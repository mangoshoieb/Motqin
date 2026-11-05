"use client";

import { useAuth } from "@/app/(public)/context/auth.context";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useAssisting, useTrackingTables } from "@/app/hooks/useTrackingTables";
import { canOnTable, canUseTrackingTables, isOwnTable } from "@/app/lib/tracking-table";
import { AssistantPermission } from "@/app/types/tracking-table.types";

// Who may use tracking tables, and as whom: teacher accounts (and the admins
// who support them) work on their own tables; any registered user a teacher
// added as an assistant works on that teacher's shared tables.
export function useTrackingAccess() {
  const { user, isLoading: userLoading } = useAuth();
  const registered = useAuthKind() === "user";
  // Guests get 403 registration_required here, which would pop the signup
  // dialog — so it's only asked for registered users.
  const assisting = useAssisting(registered);
  const links = assisting.data ?? [];
  const isTeacher = canUseTrackingTables(user);

  return {
    isTeacher,
    links,
    isLoading: userLoading || (registered && assisting.isLoading),
    canEnter: isTeacher || links.length > 0,
    // The teachers this user may create a table / import a sheet for.
    createFor: links.filter((link) => link.permissions.includes("CreateTables")),
    importFor: links.filter((link) => link.permissions.includes("Import")),
  };
}

/**
 * What the user may do on one table, read from the table list's
 * myPermissions. Until the list has loaded, a teacher is assumed to be on
 * their own table and anyone else gets nothing — buttons appear rather than
 * flash and vanish.
 */
export function useTablePermissions(groupId: string) {
  const { isTeacher } = useTrackingAccess();
  const { data: tables } = useTrackingTables();
  const table = tables?.find((t) => t.groupId === groupId);

  const can = (permission: AssistantPermission) =>
    table ? canOnTable(table, permission) : isTeacher;

  return {
    table,
    isOwner: table ? isOwnTable(table) : isTeacher,
    can,
  };
}
