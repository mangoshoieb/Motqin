// GET /lookups/* — the reference lists the backend keeps for the enums it
// stores. Every one of them is sent back as `value` (the integer the API
// expects) alongside `key` (the enum name it holds in the database) and the
// two display names.

export interface LookupItem {
  value: number;
  key: string;
  nameAr: string;
  nameEn: string;
}

export interface CountryLookupItem extends LookupItem {
  // ISO code, countries only.
  code?: string | null;
}

/**
 * Finds the item a stored value refers to. The API takes integers, but what
 * comes back on the user (GET /users/me) is the enum *name* — "Egypt",
 * "Cairo" — so both spellings have to resolve to the same row.
 */
export function findLookupItem<T extends LookupItem>(
  items: T[] | undefined,
  stored: number | string | null | undefined,
): T | undefined {
  if (!items?.length || stored === null || stored === undefined || stored === "") return undefined;

  const asNumber = Number(stored);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    const byValue = items.find((item) => item.value === asNumber);
    if (byValue) return byValue;
  }

  const text = String(stored).trim().toLowerCase();
  return items.find(
    (item) =>
      item.key?.toLowerCase() === text ||
      item.nameEn?.toLowerCase() === text ||
      item.nameAr?.trim() === String(stored).trim(),
  );
}
