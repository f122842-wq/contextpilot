import fs from "fs-extra";
import path from "path";
import { format } from "date-fns";
import { MEMORY_DIR } from "./project-memory.js";

function getCheckpointDir(baseDir: string): string {
  return path.join(baseDir, MEMORY_DIR, "checkpoints");
}

export async function createCheckpoint(
  currentGoal: string,
  completedChanges: string,
  remainingTasks: string,
  keyDecisions: string,
  baseDir = process.cwd(),
): Promise<string> {
  const dir = getCheckpointDir(baseDir);
  await fs.ensureDir(dir);

  const timestamp = format(new Date(), "yyyy-MM-dd-HH-mm-ss");
  const filename = `${timestamp}.md`;
  const filePath = path.join(dir, filename);

  const content = [
    "# ContextPilot Checkpoint",
    "",
    `**Created**: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
    "",
    "## Current Goal",
    currentGoal || "_(none recorded)_",
    "",
    "## Completed Changes",
    completedChanges || "_(none recorded)_",
    "",
    "## Remaining Tasks",
    remainingTasks || "_(none recorded)_",
    "",
    "## Key Design Decisions",
    keyDecisions || "_(none recorded)_",
    "",
  ].join("\n");

  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}

export async function listCheckpoints(baseDir = process.cwd()): Promise<string[]> {
  const dir = getCheckpointDir(baseDir);
  if (!(await fs.pathExists(dir))) {
    return [];
  }
  const files = await fs.readdir(dir);
  return files
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => path.join(dir, f));
}

export async function getLatestCheckpoint(
  baseDir = process.cwd(),
): Promise<{ path: string; content: string } | null> {
  const checkpoints = await listCheckpoints(baseDir);
  if (checkpoints.length === 0) return null;

  const latest = checkpoints[checkpoints.length - 1]!;
  const content = await fs.readFile(latest, "utf-8");
  return { path: latest, content };
}
