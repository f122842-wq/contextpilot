import fs from "fs-extra";
import path from "path";
import { projectTemplate } from "../templates/project.md.js";
import { progressTemplate } from "../templates/progress.md.js";
import { decisionsTemplate } from "../templates/decisions.md.js";
import { tasksTemplate, type Task } from "../templates/tasks.json.js";
import { agentsTemplate } from "../templates/agents.md.js";
import { rulesTemplate } from "../templates/rules.md.js";

export const MEMORY_DIR = ".contextpilot";

type FileName = "project.md" | "progress.md" | "decisions.md" | "agents.md" | "rules.md";

const TEMPLATES: Record<FileName, string> = {
  "project.md": projectTemplate,
  "progress.md": progressTemplate,
  "decisions.md": decisionsTemplate,
  "agents.md": agentsTemplate,
  "rules.md": rulesTemplate,
};

function memoryPath(baseDir: string): string {
  return path.join(baseDir, MEMORY_DIR);
}

export async function ensureProjectDir(baseDir = process.cwd()): Promise<void> {
  const dir = memoryPath(baseDir);
  await fs.ensureDir(dir);
  await fs.ensureDir(path.join(dir, "checkpoints"));

  for (const [filename, content] of Object.entries(TEMPLATES)) {
    const filePath = path.join(dir, filename);
    if (!(await fs.pathExists(filePath))) {
      await fs.writeFile(filePath, content, "utf-8");
    }
  }

  const tasksPath = path.join(dir, "tasks.json");
  if (!(await fs.pathExists(tasksPath))) {
    await fs.writeJson(tasksPath, tasksTemplate, { spaces: 2 });
  }
}

export async function readProjectFile(
  filename: FileName,
  baseDir = process.cwd(),
): Promise<string> {
  const filePath = path.join(memoryPath(baseDir), filename);
  if (!(await fs.pathExists(filePath))) {
    throw new Error(`File not found: ${filePath}. Run 'contextpilot init' first.`);
  }
  return fs.readFile(filePath, "utf-8");
}

export async function writeProjectFile(
  filename: FileName,
  content: string,
  baseDir = process.cwd(),
): Promise<void> {
  const filePath = path.join(memoryPath(baseDir), filename);
  await fs.writeFile(filePath, content, "utf-8");
}

const VALID_STATUSES = ["pending", "in_progress", "done", "blocked"] as const;

function validateTasks(data: unknown): Task[] {
  if (!Array.isArray(data)) {
    throw new Error("tasks.json must be an array");
  }
  for (const item of data) {
    if (!item || typeof item !== "object") {
      throw new Error("Each task must be an object");
    }
    const t = item as Record<string, unknown>;
    if (typeof t.id !== "string" || !t.id) {
      throw new Error("Each task must have a non-empty string 'id'");
    }
    if (typeof t.title !== "string" || !t.title) {
      throw new Error(`Task ${t.id}: must have a non-empty string 'title'`);
    }
    if (!(VALID_STATUSES as readonly string[]).includes(t.status as string)) {
      throw new Error(
        `Task ${t.id}: invalid status '${String(t.status)}'. Valid: ${VALID_STATUSES.join(", ")}`,
      );
    }
    if (t.dependsOn !== undefined && !Array.isArray(t.dependsOn)) {
      throw new Error(`Task ${t.id}: 'dependsOn' must be an array`);
    }
  }
  return data as Task[];
}

export async function readTasks(baseDir = process.cwd()): Promise<Task[]> {
  const filePath = path.join(memoryPath(baseDir), "tasks.json");
  if (!(await fs.pathExists(filePath))) {
    throw new Error(`File not found: ${filePath}. Run 'contextpilot init' first.`);
  }
  const data = await fs.readJson(filePath);
  return validateTasks(data);
}

export async function writeTasks(tasks: Task[], baseDir = process.cwd()): Promise<void> {
  const filePath = path.join(memoryPath(baseDir), "tasks.json");
  await fs.writeJson(filePath, tasks, { spaces: 2 });
}

export { type Task } from "../templates/tasks.json.js";
