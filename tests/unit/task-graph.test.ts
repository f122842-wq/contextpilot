import { describe, it, expect } from "vitest";
import {
  getTasksByStatus,
  getNextAvailable,
  updateTaskStatus,
  addTask,
  isBlocked,
} from "../../src/core/task-graph";
import type { Task } from "../../src/templates/tasks.json";

function makeTasks(): Task[] {
  return [
    { id: "1", title: "Setup", status: "done", dependsOn: [], assignedTo: null, notes: "" },
    { id: "2", title: "Core", status: "done", dependsOn: ["1"], assignedTo: null, notes: "" },
    { id: "3", title: "Feature A", status: "pending", dependsOn: ["2"], assignedTo: null, notes: "" },
    { id: "4", title: "Feature B", status: "pending", dependsOn: ["2"], assignedTo: null, notes: "" },
    { id: "5", title: "Polish", status: "pending", dependsOn: ["3", "4"], assignedTo: null, notes: "" },
    { id: "6", title: "Stuck", status: "blocked", dependsOn: ["5"], assignedTo: null, notes: "" },
  ];
}

describe("getTasksByStatus", () => {
  it("returns only tasks with given status", () => {
    const tasks = makeTasks();
    expect(getTasksByStatus(tasks, "pending")).toHaveLength(3);
    expect(getTasksByStatus(tasks, "done")).toHaveLength(2);
    expect(getTasksByStatus(tasks, "blocked")).toHaveLength(1);
  });

  it("returns empty array when no match", () => {
    const tasks = makeTasks();
    expect(getTasksByStatus(tasks, "in_progress")).toHaveLength(0);
  });
});

describe("getNextAvailable", () => {
  it("returns pending tasks whose dependencies are all done", () => {
    const tasks = makeTasks();
    const next = getNextAvailable(tasks);
    expect(next).toHaveLength(2);
    expect(next.map((t) => t.id).sort()).toEqual(["3", "4"]);
  });

  it("does not include tasks with incomplete dependencies", () => {
    const tasks = makeTasks();
    // Task 5 depends on 3 and 4 (both pending), so it shouldn't be available
    const next = getNextAvailable(tasks);
    expect(next.find((t) => t.id === "5")).toBeUndefined();
  });

  it("returns empty when nothing is ready", () => {
    const tasks: Task[] = [
      { id: "1", title: "A", status: "pending", dependsOn: ["99"], assignedTo: null, notes: "" },
    ];
    expect(getNextAvailable(tasks)).toHaveLength(0);
  });
});

describe("updateTaskStatus", () => {
  it("updates a task status", () => {
    const tasks = makeTasks();
    const updated = updateTaskStatus(tasks, "3", "done");
    expect(updated.find((t) => t.id === "3")?.status).toBe("done");
  });

  it("throws on unknown task id", () => {
    expect(() => updateTaskStatus(makeTasks(), "99", "done")).toThrow("not found");
  });

  it("does not mutate the original array", () => {
    const original = makeTasks();
    const updated = updateTaskStatus(original, "3", "done");
    expect(original.find((t) => t.id === "3")?.status).toBe("pending");
    expect(updated).not.toBe(original);
  });
});

describe("addTask", () => {
  it("adds a new task", () => {
    const tasks = makeTasks();
    const updated = addTask(tasks, "New task", ["3"]);
    expect(updated).toHaveLength(7);
    const added = updated[updated.length - 1];
    expect(added?.title).toBe("New task");
    expect(added?.status).toBe("pending");
    expect(added?.dependsOn).toEqual(["3"]);
  });

  it("does not mutate original", () => {
    const tasks = makeTasks();
    addTask(tasks, "X");
    expect(tasks).toHaveLength(6);
  });
});

describe("isBlocked", () => {
  it("returns true if any dependency is not done", () => {
    const tasks = makeTasks();
    expect(isBlocked(tasks, tasks[2]!)).toBe(false); // Task 3: dependsOn [2], 2 is done
    expect(isBlocked(tasks, tasks[4]!)).toBe(true); // Task 5: dependsOn [3,4], both pending
  });

  it("returns false for task with no dependencies", () => {
    const tasks = makeTasks();
    expect(isBlocked(tasks, tasks[0]!)).toBe(false);
  });
});
