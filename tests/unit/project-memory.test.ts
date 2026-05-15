import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import {
  ensureProjectDir,
  readProjectFile,
  writeProjectFile,
  readTasks,
  writeTasks,
  MEMORY_DIR,
} from "../../src/core/project-memory";
import { listCheckpoints } from "../../src/core/checkpoint";
import type { Task } from "../../src/templates/tasks.json";

const testWorkspace = path.join(os.tmpdir(), "contextpilot-test-" + Date.now());

beforeEach(async () => {
  await fs.ensureDir(testWorkspace);
});

afterEach(async () => {
  await fs.remove(testWorkspace);
});

describe("ensureProjectDir", () => {
  it("creates .contextpilot/ directory and all template files", async () => {
    await ensureProjectDir(testWorkspace);

    const dir = path.join(testWorkspace, MEMORY_DIR);
    expect(await fs.pathExists(dir)).toBe(true);
    expect(await fs.pathExists(path.join(dir, "project.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "progress.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "decisions.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "tasks.json"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "agents.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "rules.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "checkpoints"))).toBe(true);
  });

  it("is idempotent — running twice does not error", async () => {
    await ensureProjectDir(testWorkspace);
    await ensureProjectDir(testWorkspace);
    const dir = path.join(testWorkspace, MEMORY_DIR);
    expect(await fs.pathExists(dir)).toBe(true);
  });
});

describe("readProjectFile / writeProjectFile", () => {
  it("writes and reads a project file", async () => {
    await ensureProjectDir(testWorkspace);
    await writeProjectFile("progress.md", "# Custom Progress\n\nWorking on it.", testWorkspace);
    const content = await readProjectFile("progress.md", testWorkspace);
    expect(content).toContain("Custom Progress");
  });

  it("reads template content after init", async () => {
    await ensureProjectDir(testWorkspace);
    const content = await readProjectFile("project.md", testWorkspace);
    expect(content).toContain("Project Overview");
  });

  it("throws when reading non-existent file", async () => {
    await ensureProjectDir(testWorkspace);
    await expect(readProjectFile("nonexistent.md", testWorkspace)).rejects.toThrow();
  });
});

describe("readTasks / writeTasks", () => {
  it("reads default tasks template after init", async () => {
    await ensureProjectDir(testWorkspace);
    const tasks = await readTasks(testWorkspace);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.title).toBe("Define project scope and architecture");
  });

  it("writes and reads custom tasks", async () => {
    await ensureProjectDir(testWorkspace);
    const custom: Task[] = [
      { id: "1", title: "Setup CI", status: "done", dependsOn: [], assignedTo: null, notes: "" },
      { id: "2", title: "Add auth", status: "pending", dependsOn: ["1"], assignedTo: null, notes: "" },
    ];
    await writeTasks(custom, testWorkspace);
    const tasks = await readTasks(testWorkspace);
    expect(tasks).toHaveLength(2);
    expect(tasks[0]?.status).toBe("done");
    expect(tasks[1]?.dependsOn).toEqual(["1"]);
  });

  it("throws when reading tasks with invalid status", async () => {
    await ensureProjectDir(testWorkspace);
    await writeTasks(
      [{ id: "1", title: "Bad", status: "broken" as never, dependsOn: [], assignedTo: null, notes: "" }],
      testWorkspace,
    );
    await expect(readTasks(testWorkspace)).rejects.toThrow("invalid status");
  });
});

describe("listCheckpoints", () => {
  it("returns empty array when no checkpoints exist", async () => {
    await ensureProjectDir(testWorkspace);
    const list = await listCheckpoints(testWorkspace);
    expect(list).toEqual([]);
  });

  it("lists checkpoint files sorted by name", async () => {
    await ensureProjectDir(testWorkspace);
    const cpDir = path.join(testWorkspace, MEMORY_DIR, "checkpoints");
    await fs.writeFile(path.join(cpDir, "2025-01-01-10-00.md"), "# CP1");
    await fs.writeFile(path.join(cpDir, "2025-01-02-10-00.md"), "# CP2");
    const list = await listCheckpoints(testWorkspace);
    expect(list).toHaveLength(2);
    expect(list[0]).toContain("2025-01-01");
    expect(list[1]).toContain("2025-01-02");
  });
});
