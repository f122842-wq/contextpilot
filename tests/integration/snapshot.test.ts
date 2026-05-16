import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { runSnapshot } from "../../src/cli/commands/snapshot";
import { ensureProjectDir } from "../../src/core/project-memory";

const testWorkspace = path.join(os.tmpdir(), "cp-snapshot-" + Date.now());

beforeEach(async () => {
  await fs.ensureDir(testWorkspace);
  await ensureProjectDir(testWorkspace);
});

afterEach(async () => {
  await fs.remove(testWorkspace);
});

describe("snapshot command", () => {
  it("creates a checkpoint file in .contextpilot/checkpoints/", async () => {
    const filePath = await runSnapshot(testWorkspace);
    expect(filePath).toContain(".contextpilot");
    expect(filePath).toContain("checkpoints");
    expect(await fs.pathExists(filePath)).toBe(true);
  });

  it("snapshot file contains expected sections", async () => {
    const filePath = await runSnapshot(testWorkspace);
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toContain("# ContextPilot Snapshot");
    expect(content).toContain("**Created**:");
    expect(content).toContain("## Project Overview");
    expect(content).toContain("## Progress");
    expect(content).toContain("## Decisions");
    expect(content).toContain("## Tasks");
    expect(content).toContain("## Agent Config");
    expect(content).toContain("## Rules");
  });

  it("snapshot includes task statistics", async () => {
    const filePath = await runSnapshot(testWorkspace);
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toMatch(/Total: \d+/);
    expect(content).toMatch(/done: \d+/);
    expect(content).toMatch(/pending: \d+/);
  });

  it("creates unique filenames with timestamps", async () => {
    const file1 = await runSnapshot(testWorkspace);
    // small delay to ensure different timestamp in filename
    await new Promise((r) => setTimeout(r, 1100));
    const file2 = await runSnapshot(testWorkspace);
    expect(file1).not.toBe(file2);
    expect(await fs.pathExists(file1)).toBe(true);
    expect(await fs.pathExists(file2)).toBe(true);
  });

  it("works even without prior init (creates directory and proceeds)", async () => {
    const emptyDir = path.join(testWorkspace, "empty");
    await fs.ensureDir(emptyDir);
    const filePath = await runSnapshot(emptyDir);
    expect(await fs.pathExists(filePath)).toBe(true);
  });
});
