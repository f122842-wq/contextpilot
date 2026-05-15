import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { format } from "date-fns";
import { createCheckpoint, getLatestCheckpoint, listCheckpoints } from "../../src/core/checkpoint";
import { ensureProjectDir } from "../../src/core/project-memory";

const testWorkspace = path.join(os.tmpdir(), "contextpilot-cp-test-" + Date.now());

beforeEach(async () => {
  await fs.ensureDir(testWorkspace);
  await ensureProjectDir(testWorkspace);
});

afterEach(async () => {
  await fs.remove(testWorkspace);
});

describe("createCheckpoint", () => {
  it("creates a checkpoint file with timestamp", async () => {
    const filePath = await createCheckpoint(
      "Building auth module",
      "Added login, logout",
      "Add registration, password reset",
      "Used JWT instead of sessions",
      testWorkspace,
    );
    expect(await fs.pathExists(filePath)).toBe(true);
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toContain("Building auth module");
    expect(content).toContain("Added login, logout");
    expect(content).toContain("Add registration, password reset");
    expect(content).toContain("Used JWT instead of sessions");
    expect(content).toContain("# ContextPilot Checkpoint");
  });

  it("uses current date in filename", async () => {
    const filePath = await createCheckpoint("Test", "", "", "", testWorkspace);
    const today = format(new Date(), "yyyy-MM-dd");
    expect(path.basename(filePath)).toContain(today);
  });
});

describe("listCheckpoints", () => {
  it("lists checkpoints in order", async () => {
    await createCheckpoint("CP1", "", "", "", testWorkspace);
    await new Promise((r) => setTimeout(r, 1100)); // ensure different second
    await createCheckpoint("CP2", "", "", "", testWorkspace);

    const list = await listCheckpoints(testWorkspace);
    expect(list.length).toBeGreaterThanOrEqual(2);
    const lastContent = await fs.readFile(list[list.length - 1]!, "utf-8");
    expect(lastContent).toContain("CP2");
  });
});

describe("getLatestCheckpoint", () => {
  it("returns null when no checkpoints exist", async () => {
    const latest = await getLatestCheckpoint(testWorkspace);
    expect(latest).toBeNull();
  });

  it("returns the newest checkpoint content", async () => {
    await createCheckpoint("First", "", "", "", testWorkspace);
    await createCheckpoint("Second", "", "", "", testWorkspace);

    const latest = await getLatestCheckpoint(testWorkspace);
    expect(latest).not.toBeNull();
    expect(latest?.content).toContain("Second");
  });
});
