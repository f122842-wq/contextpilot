import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { runInit } from "../../src/cli/commands/init";
import { runPlan } from "../../src/cli/commands/plan";
import { writeTasks } from "../../src/core/project-memory";

const testWorkspace = path.join(os.tmpdir(), "contextpilot-plan-" + Date.now());

beforeEach(async () => {
  await fs.ensureDir(testWorkspace);
  await runInit(testWorkspace);
});

afterEach(async () => {
  await fs.remove(testWorkspace);
});

describe("plan command", () => {
  it("suggests next available tasks", async () => {
    await writeTasks(
      [
        { id: "1", title: "Setup project", status: "done", dependsOn: [], assignedTo: null, notes: "" },
        { id: "2", title: "Add login page", status: "pending", dependsOn: ["1"], assignedTo: null, notes: "" },
      ],
      testWorkspace,
    );
    const result = await runPlan(testWorkspace);
    expect(result).toContain("Add login page");
  });

  it("reports when no tasks are available", async () => {
    // All tasks are done, so nothing is available
    await writeTasks(
      [
        { id: "1", title: "All done", status: "done", dependsOn: [], assignedTo: null, notes: "" },
      ],
      testWorkspace,
    );
    const result = await runPlan(testWorkspace);
    expect(result).toContain("No tasks");
  });
});
