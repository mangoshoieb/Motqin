// Which kind of account a new user is making: picked by the sign-up page's
// try-as-a-guest lines (طالب · معلم · ولي أمر) or on the «بياناتك» form.
// Kept in sessionStorage like the invite code so it survives /verify-phone
// and the Google steps, sent on the calls that create the account
// (phone-complete-signup, auth/google, google/phone-verify) and cleared on
// sign-in. "Mentor" is the backend's name for a parent or supervisor.

export type AccountType = "Student" | "Teacher" | "Mentor";

const STORAGE_KEY = "accountType";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  Student: "طالب",
  Teacher: "معلم",
  Mentor: "ولي أمر أو مشرف",
};

const storage = () => {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
};

const isAccountType = (value: unknown): value is AccountType =>
  value === "Student" || value === "Teacher" || value === "Mentor";

export const getAccountType = (): AccountType => {
  const stored = storage()?.getItem(STORAGE_KEY);
  return isAccountType(stored) ? stored : "Student";
};

export const setAccountType = (type: AccountType) => {
  if (type === "Student") storage()?.removeItem(STORAGE_KEY);
  else storage()?.setItem(STORAGE_KEY, type);
};

export const clearAccountType = () => storage()?.removeItem(STORAGE_KEY);

// Adds accountType to a signup body unless it already has one. Student is
// the server's default, so it's left out.
export const withAccountType = <T extends { accountType?: AccountType }>(body: T): T => {
  const type = body.accountType ?? getAccountType();
  const rest = { ...body };
  delete rest.accountType;
  return type === "Student" ? (rest as T) : { ...rest, accountType: type };
};

// Teachers and parents have no stage or grade, and need a phone (a parent,
// mentor or teacher finds a student by phone).
export const isStudent = (type: AccountType) => type === "Student";
