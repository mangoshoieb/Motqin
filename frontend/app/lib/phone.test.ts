import { describe, expect, it } from "vitest";
import { samePhone, splitPhone, toInternationalPhone } from "./phone";

describe("toInternationalPhone", () => {
  it("drops the leading 0 and adds the picked code", () => {
    expect(toInternationalPhone(20, "01000000221")).toBe("+201000000221");
    expect(toInternationalPhone(962, "0790000987")).toBe("+962790000987");
    expect(toInternationalPhone(966, "50 000 0123")).toBe("+966500000123");
  });

  it("reads Arabic digits", () => {
    expect(toInternationalPhone(20, "٠١٠٠٠٠٠٠٢٢١")).toBe("+201000000221");
  });

  it("keeps a number typed with its own code", () => {
    expect(toInternationalPhone(20, "+966 50 000 0123")).toBe("+966500000123");
    expect(toInternationalPhone(20, "00966500000123")).toBe("+966500000123");
  });

  it("refuses what can't be a mobile", () => {
    expect(toInternationalPhone(20, "12345")).toBeNull();
    expect(toInternationalPhone(20, "0223456789")).toBeNull();
    expect(toInternationalPhone(20, "")).toBeNull();
    expect(toInternationalPhone(966, "12")).toBeNull();
  });
});

describe("splitPhone", () => {
  it("finds the longest matching code", () => {
    expect(splitPhone("+966500000123", [1, 20, 966])).toEqual({ dialCode: 966, number: "500000123" });
    expect(splitPhone("+201000000221", [1, 20, 966])).toEqual({ dialCode: 20, number: "01000000221" });
  });
});

describe("samePhone", () => {
  it("matches the stored Egyptian form to the international one", () => {
    expect(samePhone("01000000221", "+201000000221")).toBe(true);
    expect(samePhone("+966500000123", "+966500000123")).toBe(true);
    expect(samePhone("01000000221", "+966500000123")).toBe(false);
  });
});
