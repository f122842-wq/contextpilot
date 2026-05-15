import { describe, it, expect } from "vitest";
import { createResumePrompt, type AdapterConfig } from "../../src/core/adapter";
import { createResumePrompt as claudeResume } from "../../src/adapters/claude-code";

describe("createResumePrompt (generic)", () => {
  const config: AdapterConfig = {
    projectOverview: "# My Project\nA test project.",
    progress: "## Done\n- Login\n## In Progress\n- Dashboard",
    decisions: "## Decision 1\nUse JWT",
    tasks: [
      { id: "1", title: "Setup", status: "done", dependsOn: [], assignedTo: null, notes: "" },
      { id: "2", title: "Dashboard", status: "pending", dependsOn: ["1"], assignedTo: null, notes: "" },
    ],
    latestCheckpoint: "# CP\nGoal: Build dashboard",
  };

  it("includes project overview in prompt", () => {
    const prompt = createResumePrompt(config);
    expect(prompt).toContain("My Project");
  });

  it("includes next available tasks", () => {
    const prompt = createResumePrompt(config);
    expect(prompt).toContain("Dashboard");
  });

  it("includes checkpoint content", () => {
    const prompt = createResumePrompt(config);
    expect(prompt).toContain("Build dashboard");
  });

  it("warns about design rework", () => {
    const prompt = createResumePrompt(config);
    expect(prompt).toContain("DO NOT");
  });
});

describe("Claude Code adapter", () => {
  it("generates Claude-specific format", () => {
    const prompt = claudeResume({
      projectOverview: "# Test",
      progress: "## OK",
      decisions: "",
      tasks: [],
      latestCheckpoint: null,
    });
    expect(prompt).toContain("Claude");
  });
});
