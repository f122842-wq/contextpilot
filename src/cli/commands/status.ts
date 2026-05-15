import { Command } from "commander";
import { readProjectFile, readTasks } from "../../core/project-memory.js";

export async function runStatus(baseDir = process.cwd()): Promise<string> {
  const progress = await readProjectFile("progress.md", baseDir);
  const tasks = await readTasks(baseDir);

  const taskCounts = {
    done: tasks.filter((t) => t.status === "done").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
  };

  const lines = [
    "# Project Status",
    "",
    "## Progress",
    progress.trim(),
    "",
    "## Task Summary",
    `Total: ${tasks.length} | done: ${taskCounts.done} | in_progress: ${taskCounts.in_progress} | pending: ${taskCounts.pending} | blocked: ${taskCounts.blocked}`,
    "",
  ];

  return lines.join("\n");
}

export const statusCommand = new Command("status")
  .description("Read and display current project state")
  .action(async () => {
    const output = await runStatus();
    console.log(output);
  });
