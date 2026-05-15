import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { runInit } from "../../src/cli/commands/init";

const testWorkspace = path.join(os.tmpdir(), "contextpilot-int-" + Date.now());

beforeEach(async () => {
  await fs.ensureDir(testWorkspace);
});

afterEach(async () => {
  await fs.remove(testWorkspace);
});

describe("init command", () => {
  it("creates .contextpilot directory with all template files", async () => {
    await runInit(testWorkspace);

    const dir = path.join(testWorkspace, ".contextpilot");
    expect(await fs.pathExists(dir)).toBe(true);
    expect(await fs.pathExists(path.join(dir, "project.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "progress.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "decisions.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "tasks.json"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "agents.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "rules.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "checkpoints"))).toBe(true);
  });

  it("is idempotent", async () => {
    await runInit(testWorkspace);
    await runInit(testWorkspace);
    const dir = path.join(testWorkspace, ".contextpilot");
    expect(await fs.pathExists(dir)).toBe(true);
  });
});
