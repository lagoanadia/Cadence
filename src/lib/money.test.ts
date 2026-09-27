import { describe, expect, it } from "vitest";
import { centsToInput, formatEuros, parseEuroInput } from "./money";

describe("parseEuroInput", () => {
  it("understands whole numbers and both decimal separators", () => {
    expect(parseEuroInput("12")).toBe(1200);
    expect(parseEuroInput("12,5")).toBe(1250);
    expect(parseEuroInput("12.50")).toBe(1250);
    expect(parseEuroInput("0,99")).toBe(99);
  });

  it("understands thousands separators", () => {
    expect(parseEuroInput("1.234,56")).toBe(123456);
    expect(parseEuroInput("1,234.56")).toBe(123456);
    expect(parseEuroInput("1.234")).toBe(123400);
  });

  it("ignores the euro sign and spaces", () => {
    expect(parseEuroInput(" 3,20 € ")).toBe(320);
  });

  it("rejects things that aren't a positive amount", () => {
    expect(parseEuroInput("")).toBeNull();
    expect(parseEuroInput("abc")).toBeNull();
    expect(parseEuroInput("-5")).toBeNull();
    expect(parseEuroInput("0")).toBeNull();
    expect(parseEuroInput("1,2,3a")).toBeNull();
  });

  it("avoids floating point errors", () => {
    // 0.1 + 0.2 !== 0.3 in JS, but we never do float math on money
    expect(parseEuroInput("0,1")! + parseEuroInput("0,2")!).toBe(30);
  });
});

describe("formatEuros", () => {
  it("formats in the Spanish style", () => {
    expect(formatEuros(123456)).toBe("1.234,56 €");
    expect(formatEuros(5)).toBe("0,05 €");
    expect(formatEuros(-1500)).toBe("-15,00 €");
    expect(formatEuros(1234567, { decimals: false })).toBe("12.345 €");
  });

  it("round-trips through the input format", () => {
    expect(parseEuroInput(centsToInput(4099))).toBe(4099);
  });
});
