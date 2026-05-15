import { describe, it, expect } from "vitest";
import { estimateUsage, isOverThreshold, formatUsageReport } from "../../src/core/context-budget";

describe("estimateUsage", () => {
  it("returns 0 for empty input", () => {
    expect(estimateUsage("", 100000)).toBe(0);
  });

  it("estimates usage as ratio of characters to maxTokens * 4", () => {
    // 4 chars ~= 1 token
    const usage = estimateUsage("aaaa", 100);
    // 4 chars / (100 tokens * 4) = 4 / 400 = 0.01 = 1%
    expect(usage).toBeCloseTo(0.01);
  });

  it("returns 1 when input exceeds window", () => {
    const usage = estimateUsage("x".repeat(500), 100);
    expect(usage).toBeGreaterThan(1);
  });
});

describe("isOverThreshold", () => {
  it("returns false under threshold", () => {
    expect(isOverThreshold("hello", 1000, 0.6)).toBe(false);
  });

  it("returns true over threshold", () => {
    // 400 chars / (10 tokens * 4) = 400 / 40 = 10.0 >> 60%
    expect(isOverThreshold("x".repeat(400), 10, 0.6)).toBe(true);
  });

  it("defaults threshold to 0.6", () => {
    expect(isOverThreshold("x".repeat(400), 10)).toBe(true);
  });
});

describe("formatUsageReport", () => {
  it("formats usage as percentage", () => {
    // 40 chars / (100 tokens * 4) = 40/400 = 10%
    const report = formatUsageReport("0123456789012345678901234567890123456789", 100);
    expect(report).toContain("10.0%");
    expect(report).toContain("Context usage");
  });

  it("warns when over threshold", () => {
    const report = formatUsageReport("x".repeat(400), 10);
    expect(report).toContain("WARNING");
    expect(report).toContain("checkpoint");
  });
});
