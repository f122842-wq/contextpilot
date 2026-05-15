import { Command } from "commander";
import { readTasks } from "../../core/project-memory.js";
import { getNextAvailable } from "../../core/task-graph.js";

export async function runPlan(baseDir = process.cwd()): Promise<string> {
  const tasks = await readTasks(baseDir);
  const available = getNextAvailable(tasks);

  if (available.length === 0) {
    return "No tasks are currently ready to work on.\n\nCheck if pending tasks have unmet dependencies or if all tasks are done.";
  }

  const lines = [
    "# Suggested Next Tasks",
    "",
    "The following tasks are pending and have all dependencies satisfied:",
    "",
  ];

  for (const task of available) {
    lines.push(`- [${task.id}] ${task.title}`);
  }

  lines.push("", "Run 'contextpilot status' for full project state.");
  return lines.join("\n");
}

export const planCommand = new Command("plan")
  .description("Suggest next tasks based on project state")
  .action(async () => {
    const output = await runPlan();
    console.log(output);
  });
