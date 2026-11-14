// The competition invite code a new student signs up with
// (/sign-up?inviterCode=…). It's read when they land on an auth page and kept
// in sessionStorage so it survives /verify-phone, the profile form and the
// Google steps, then sent on the request that creates the account:
// phone-complete-signup, google and google/phone-verify. The server trims and
// normalises it, ignores an unknown code, and ignores it for an existing
// account, so it never blocks signing in.

const STORAGE_KEY = "inviterCode";

const storage = () => {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
};

export const getInviterCode = (): string => storage()?.getItem(STORAGE_KEY) ?? "";

export const setInviterCode = (code: string) => {
  const value = code.trim();
  if (value) storage()?.setItem(STORAGE_KEY, value);
  else storage()?.removeItem(STORAGE_KEY);
};

export const clearInviterCode = () => storage()?.removeItem(STORAGE_KEY);

// Saves ?inviterCode=… from the current URL, if there is one.
export const saveInviterCodeFromUrl = () => {
  if (typeof window === "undefined") return;
  const code = new URLSearchParams(window.location.search).get("inviterCode");
  if (code?.trim()) setInviterCode(code);
};

// Adds the code to a signup body. A body that already has inviterCode keeps
// it (the profile form sends what the student typed — "" means they cleared
// it); otherwise the stored one is used.
export const withInviterCode = <T extends { inviterCode?: string }>(body: T): T => {
  const code = (body.inviterCode ?? getInviterCode()).trim();
  const rest = { ...body };
  delete rest.inviterCode;
  return code ? { ...rest, inviterCode: code } : (rest as T);
};
