import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { runInit } from "../../src/cli/commands/init";
import { runStatus } from "../../src/cli/commands/status";
import { writeProjectFile, writeTasks } from "../../src/core/project-memory";

const testWorkspace = path.join(os.tmpdir(), "contextpilot-status-" + Date.now());

beforeEach(async () => {
  await fs.ensureDir(testWorkspace);
  await runInit(testWorkspace);
});

afterEach(async () => {
  await fs.remove(testWorkspace);
});

describe("status command", () => {
  it("returns status string containing project info", async () => {
    await writeProjectFile("progress.md", "## In Progress\n- Building UI", testWorkspace);
    const result = await runStatus(testWorkspace);
    expect(result).toContain("Project Status");
    expect(result).toContain("Building UI");
  });

  it("shows task summary", async () => {
    await writeTasks(
      [
        { id: "1", title: "A", status: "done", dependsOn: [], assignedTo: null, notes: "" },
        { id: "2", title: "B", status: "pending", dependsOn: [], assignedTo: null, notes: "" },
      ],
      testWorkspace,
    );
    const result = await runStatus(testWorkspace);
    expect(result).toContain("done: 1");
    expect(result).toContain("pending: 1");
  });

  it("reports when no tasks exist", async () => {
    const result = await runStatus(testWorkspace);
    expect(result).toContain("Project Status");
  });
});
