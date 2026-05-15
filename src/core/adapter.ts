import type { Task } from "../templates/tasks.json";
import { getNextAvailable } from "./task-graph.js";

export interface AdapterConfig {
  projectOverview: string;
  progress: string;
  decisions: string;
  tasks: Task[];
  latestCheckpoint: string | null;
}

export function createResumePrompt(config: AdapterConfig): string {
  const nextTasks = getNextAvailable(config.tasks);
  const taskLines = nextTasks.length
    ? nextTasks.map((t) => `- [${t.id}] ${t.title}`).join("\n")
    : "_(no tasks ready)_";

  const parts = [
    "You are resuming work on this project.",
    "",
    "## Project Overview",
    config.projectOverview,
    "",
    "## Current Progress",
    config.progress,
    "",
    "## Key Decisions",
    config.decisions || "_(none recorded)_",
    "",
    "## Next Tasks (pending, dependencies satisfied)",
    taskLines,
  ];

  if (config.latestCheckpoint) {
    parts.push("", "## Latest Checkpoint", config.latestCheckpoint);
  }

  parts.push(
    "",
    "## Instructions",
    "- DO NOT re-design confirmed architecture.",
    "- Execute only the 'Next Tasks' listed above.",
    "- If code and documentation diverge, report the discrepancy first.",
    "- Update .contextpilot/progress.md after each completed task.",
  );

  return parts.join("\n");
}
