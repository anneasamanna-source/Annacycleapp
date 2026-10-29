import { describe, expect, it } from "vitest";
import { normalizeNumber, validateListing } from "@/lib/validation/listing";

const NOW = new Date("2026-10-25T12:00:00+05:30");
const good = { crop: "tomato", quantity: "100", unit: "kg", price: "24", district: "Hooghly", area: "Chinsurah", condition: "good",
  collectFrom: "2026-10-25T16:00", collectUntil: "2026-10-26T10:00", recoverBy: "2026-10-26T18:00" };
const errs = (o: object) => { const r = validateListing({ ...good, ...o }, NOW); return r.ok ? {} : r.errors; };

describe("listing validation", () => {
  it("accepts a good listing and converts to kg", () => {
    const r = validateListing({ ...good, quantity: "2.5", unit: "quintal" }, NOW);
    expect(r.ok && r.data.totalKg).toBe(250);
  });
  it("reads Bengali digits and commas", () => {
    expect(normalizeNumber("১,০০")).toBe("100");
    expect(validateListing({ ...good, quantity: "১০০" }, NOW).ok).toBe(true);
  });
  it("lists every missing required field", () => {
    const r = validateListing({}, NOW);
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(["area", "collectFrom", "collectUntil", "condition", "crop", "district", "price", "quantity", "recoverBy", "unit"]);
  });
  it("rejects bad numbers and unknown choices", () => {
    expect(errs({ quantity: "abc", price: "-3" })).toEqual({ quantity: "numInvalid", price: "priceMin" });
    expect(errs({ crop: "<script>", district: "Atlantis" })).toEqual({ crop: "pick", district: "pick" });
    expect(errs({ quantity: "2000", unit: "quintal" })).toEqual({ quantity: "qtyMax" });
  });
  it("checks that dates make sense", () => {
    expect(errs({ collectUntil: "2026-10-25T10:00" })).toEqual({ collectUntil: "collectEnd" });
    expect(errs({ recoverBy: "2026-10-25T09:00" })).toEqual({ recoverBy: "recoverPast" });
    expect(errs({ recoverBy: "2026-10-25T14:00" })).toEqual({ recoverBy: "recoverBeforeCollect" });
    expect(errs({ harvested: "2026-10-30T10:00" })).toEqual({ harvested: "dateFuture" });
  });
});
