const toLatinDigits = (input: string) =>
  input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

// The server takes 01xxxxxxxxx, +20 1xx…, spaces and Arabic digits; this
// gets typed input to the plain form so it can be checked before sending.
export function normalizeEgyptianPhone(input: string): string | null {
  let phone = toLatinDigits(input).replace(/[\s\-()]/g, "");

  if (phone.startsWith("+20")) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith("0020")) phone = `0${phone.slice(4)}`;
  else if (phone.startsWith("20") && phone.length === 12) phone = `0${phone.slice(2)}`;

  return /^01[0125]\d{8}$/.test(phone) ? phone : null;
}

export const EGYPT_DIAL_CODE = 20;

export const PHONE_INVALID_MESSAGE = "أدخل رقم موبايل صحيح";

// A number from the country-code picker: "+" + dialCode + the number
// without its leading 0 (01001234567 with +20 → +201001234567). A number
// typed with its own "+" or "00" code is kept as typed. Returns null when
// it can't be a mobile number; the server does the real check and its
// details.PhoneNumber message is shown under the field.
export function toInternationalPhone(dialCode: number, input: string): string | null {
  let digits = toLatinDigits(input).replace(/[\s\-().]/g, "");
  if (!digits) return null;

  if (digits.startsWith("+")) {
    digits = digits.slice(1);
    return /^\d{8,15}$/.test(digits) ? `+${digits}` : null;
  }
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
    return /^\d{8,15}$/.test(digits) ? `+${digits}` : null;
  }

  const national = digits.replace(/^0+/, "");
  if (!/^\d+$/.test(national)) return null;

  if (dialCode === EGYPT_DIAL_CODE && !/^1[0125]\d{8}$/.test(national)) return null;
  const full = `${dialCode}${national}`;
  return full.length >= 8 && full.length <= 15 ? `+${full}` : null;
}

// The phone fields' value: the picked country's dial code and the number.
export interface PhoneValue {
  dialCode: number;
  number: string;
  // The picked country, since several share a code (+1).
  countryValue?: number;
}

export const EMPTY_PHONE: PhoneValue = { dialCode: EGYPT_DIAL_CODE, number: "" };

// Back from "+966500000123" / "01000000211" to picker + number, for a
// number kept from an earlier step.
export function splitPhone(phone: string, dialCodes: number[]): PhoneValue {
  if (!phone) return EMPTY_PHONE;
  if (!phone.startsWith("+")) return { dialCode: EGYPT_DIAL_CODE, number: phone };
  const digits = phone.slice(1);
  // Longest matching code first: +1 vs +1268, +20 vs +2…
  const match = [...dialCodes]
    .sort((a, b) => String(b).length - String(a).length)
    .find((code) => digits.startsWith(String(code)));
  if (!match) return { dialCode: EGYPT_DIAL_CODE, number: phone };
  const rest = digits.slice(String(match).length);
  return { dialCode: match, number: match === EGYPT_DIAL_CODE ? `0${rest}` : rest };
}
