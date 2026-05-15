import { Command } from "commander";
import { readProjectFile, readTasks } from "../../core/project-memory.js";
import { createCheckpoint } from "../../core/checkpoint.js";

function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = content.match(regex);
  return match?.[1]?.trim() || `See ${heading.toLowerCase()} section`;
}

export async function runCheckpoint(baseDir = process.cwd()): Promise<string> {
  const progress = await readProjectFile("progress.md", baseDir);
  const decisions = await readProjectFile("decisions.md", baseDir);
  const tasks = await readTasks(baseDir);

  const currentGoal = extractSection(progress, "Current Status") || extractSection(progress, "In Progress");
  const completedChanges = extractSection(progress, "Completed");
  const pendingTasks = tasks
    .filter((t) => t.status === "pending")
    .map((t) => `- [${t.id}] ${t.title}`)
    .join("\n");

  const filePath = await createCheckpoint(
    currentGoal,
    completedChanges,
    pendingTasks || "No pending tasks",
    decisions || "No decisions recorded",
    baseDir,
  );

  return filePath;
}

export const checkpointCommand = new Command("checkpoint")
  .description("Generate a context snapshot")
  .action(async () => {
    const filePath = await runCheckpoint();
    console.log(`Checkpoint created: ${filePath}`);
    console.log("Safe to start a new session. Use 'contextpilot resume' to continue.");
  });
