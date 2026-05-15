import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { runInit } from "../../src/cli/commands/init";
import { runResume } from "../../src/cli/commands/resume";
import { writeProjectFile } from "../../src/core/project-memory";

const testWorkspace = path.join(os.tmpdir(), "contextpilot-resume-" + Date.now());

beforeEach(async () => {
  await fs.ensureDir(testWorkspace);
  await runInit(testWorkspace);
});

afterEach(async () => {
  await fs.remove(testWorkspace);
});

describe("resume command", () => {
  it("generates a resume prompt", async () => {
    const prompt = await runResume(testWorkspace);
    expect(prompt).toContain("resuming work");
    expect(prompt).toContain("Project Overview");
  });

  it("warns against re-design in prompt", async () => {
    const prompt = await runResume(testWorkspace);
    expect(prompt).toContain("DO NOT");
  });

  it("includes progress when available", async () => {
    await writeProjectFile("progress.md", "## Done\n- Auth module", testWorkspace);
    const prompt = await runResume(testWorkspace);
    expect(prompt).toContain("Auth module");
  });
});
