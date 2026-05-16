import { describe, it, expect } from "vitest";
import { resolveThreshold, parseThresholdFromRules } from "../../src/core/config";

describe("resolveThreshold", () => {
  it("returns the value when given a valid number", () => {
    expect(resolveThreshold(80)).toBe(80);
  });

  it("returns the value when a valid boundary number", () => {
    expect(resolveThreshold(1)).toBe(1);
    expect(resolveThreshold(100)).toBe(100);
  });

  it("returns fallback when given 0", () => {
    expect(resolveThreshold(0, 60)).toBe(60);
  });

  it("returns fallback when given a number above 100", () => {
    expect(resolveThreshold(101, 60)).toBe(60);
  });

  it("returns fallback when given a negative number", () => {
    expect(resolveThreshold(-5, 60)).toBe(60);
  });

  it("converts a numeric string to number", () => {
    expect(resolveThreshold("75", 60)).toBe(75);
  });

  it("returns fallback for non-numeric string", () => {
    expect(resolveThreshold("abc", 60)).toBe(60);
  });

  it("returns fallback for undefined", () => {
    expect(resolveThreshold(undefined, 60)).toBe(60);
  });

  it("returns fallback for null", () => {
    expect(resolveThreshold(null, 60)).toBe(60);
  });

  it("returns fallback for NaN", () => {
    expect(resolveThreshold(NaN, 60)).toBe(60);
  });

  it("uses 60 as default fallback when not provided", () => {
    expect(resolveThreshold(undefined)).toBe(60);
  });
});

describe("parseThresholdFromRules", () => {
  it("extracts percentage from rules content", () => {
    expect(parseThresholdFromRules("context usage reaches 75% of the available window")).toBe(75);
  });

  it("defaults to 60 when no percentage found", () => {
    expect(parseThresholdFromRules("no threshold here")).toBe(60);
  });

  it("handles 100%", () => {
    expect(parseThresholdFromRules("when at 100% trigger snapshot")).toBe(100);
  });

  it("handles empty string", () => {
    expect(parseThresholdFromRules("")).toBe(60);
  });

  it("ignores percentages outside 1-100 range", () => {
    expect(parseThresholdFromRules("0% is not valid")).toBe(60);
  });
});
