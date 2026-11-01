// The server takes 01xxxxxxxxx, +20 1xx…, spaces and Arabic digits; this
// gets typed input to the plain form so it can be checked before sending.
export function normalizeEgyptianPhone(input: string): string | null {
  let phone = input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s\-()]/g, "");

  if (phone.startsWith("+20")) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith("0020")) phone = `0${phone.slice(4)}`;
  else if (phone.startsWith("20") && phone.length === 12) phone = `0${phone.slice(2)}`;

  return /^01[0125]\d{8}$/.test(phone) ? phone : null;
}
