import type { Task, TaskStatus } from "../templates/tasks.json";

export function getTasksByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((t) => t.status === status);
}

export function getNextAvailable(tasks: Task[]): Task[] {
  return tasks.filter((t) => {
    if (t.status !== "pending") return false;
    return !isBlocked(tasks, t);
  });
}

export function isBlocked(tasks: Task[], task: Task): boolean {
  if (task.dependsOn.length === 0) return false;
  return task.dependsOn.some((depId) => {
    const dep = tasks.find((t) => t.id === depId);
    return !dep || dep.status !== "done";
  });
}

export function updateTaskStatus(tasks: Task[], id: string, status: TaskStatus): Task[] {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Task not found: ${id}`);
  }
  const updated = [...tasks];
  updated[index] = { ...updated[index]!, status };
  return updated;
}

export function addTask(tasks: Task[], title: string, dependsOn: string[] = []): Task[] {
  const maxId = tasks.reduce((max, t) => Math.max(max, parseInt(t.id, 10)), 0);
  const newTask: Task = {
    id: String(maxId + 1),
    title,
    status: "pending",
    dependsOn,
    assignedTo: null,
    notes: "",
  };
  return [...tasks, newTask];
}
