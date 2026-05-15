import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { runInit } from "../../src/cli/commands/init";
import { runCheckpoint } from "../../src/cli/commands/checkpoint";
import { listCheckpoints } from "../../src/core/checkpoint";

const testWorkspace = path.join(os.tmpdir(), "contextpilot-cpcmd-" + Date.now());

beforeEach(async () => {
  await fs.ensureDir(testWorkspace);
  await runInit(testWorkspace);
});

afterEach(async () => {
  await fs.remove(testWorkspace);
});

describe("checkpoint command", () => {
  it("creates a checkpoint file", async () => {
    await runCheckpoint(testWorkspace);
    const cps = await listCheckpoints(testWorkspace);
    expect(cps.length).toBe(1);
  });

  it("includes current goal in checkpoint", async () => {
    await runCheckpoint(testWorkspace);
    const cps = await listCheckpoints(testWorkspace);
    const content = await fs.readFile(cps[0]!, "utf-8");
    expect(content).toContain("ContextPilot Checkpoint");
  });
});
