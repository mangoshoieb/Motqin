// "اشتراكك على كيفك" prices, checked against the examples in the Payments
// and Customisable Plans guides (S2 · 1 month, 179 EGP).
import { describe, expect, it } from "vitest";
import { customPrice, fromPrice, keptGroupsParam } from "./payments";
import { Bundle, BundleGroup } from "../types/payment.types";

const group = (name: string, discountPercent: number | null): BundleGroup => ({
  group: name,
  removable: discountPercent !== null,
  discountPercent,
  saving: null,
  features: [],
});

const s2 = {
  price: 179,
  customizable: true,
  groups: [
    group("StudyPlanner", 25),
    group("SpacedRepetition", 30),
    group("DistractionBlocker", 15),
    group("Mentor", 10),
  ],
} as unknown as Bundle;

describe("customPrice", () => {
  it("is the full price with nothing taken off", () => {
    expect(customPrice(s2, [])).toBe(179);
  });

  it("matches the guide's examples", () => {
    expect(customPrice(s2, ["DistractionBlocker"])).toBe(153);
    expect(customPrice(s2, ["Mentor"])).toBe(162);
    expect(customPrice(s2, ["StudyPlanner"])).toBe(135);
    expect(customPrice(s2, ["SpacedRepetition", "DistractionBlocker", "Mentor"])).toBe(81);
  });

  it("is at least 1 EGP below the full price once anything is off", () => {
    const cheap = { ...s2, price: 10, groups: [group("A", 5), group("B", 5)] } as unknown as Bundle;
    expect(customPrice(cheap, ["A"])).toBe(9);
  });

  it("ignores groups the plan can't drop", () => {
    expect(customPrice(s2, ["TrackingTables"])).toBe(179);
  });
});

describe("fromPrice", () => {
  it("keeps only the cheapest main feature", () => {
    // Everything off but Mentor (10%): 70% off → ceil(179 × 0.30) = 54.
    expect(fromPrice(s2)).toBe(54);
  });

  it("is null for a plan sold whole", () => {
    expect(fromPrice({ ...s2, customizable: false } as Bundle)).toBeNull();
  });
});

describe("keptGroupsParam", () => {
  it("is null when every removable main feature is kept", () => {
    expect(keptGroupsParam(s2, ["StudyPlanner", "SpacedRepetition", "DistractionBlocker", "Mentor"])).toBeNull();
  });

  it("lists the kept ones in the plan's order", () => {
    expect(keptGroupsParam(s2, ["Mentor", "StudyPlanner"])).toEqual(["StudyPlanner", "Mentor"]);
  });
});
