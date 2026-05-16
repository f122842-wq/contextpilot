import fs from "fs-extra";
import path from "path";
import { projectTemplate, type ProjectType } from "../templates/project.md.js";
import { progressTemplate } from "../templates/progress.md.js";
import { decisionsTemplate } from "../templates/decisions.md.js";
import { tasksTemplate, type Task } from "../templates/tasks.json.js";
import { agentsTemplate } from "../templates/agents.md.js";
import { rulesTemplate as rulesTemplateFn } from "../templates/rules.md.js";
import type { ScanResult, GitSummary } from "./project-scanner.js";
import { generateProjectFromScan, generateProgressFromGit } from "./project-scanner.js";

export const MEMORY_DIR = ".contextpilot";

type FileName = "project.md" | "progress.md" | "decisions.md" | "agents.md" | "rules.md";

function buildTemplates(threshold: number, projectType: ProjectType = "web"): Record<FileName, string> {
  return {
    "project.md": projectTemplate(projectType),
    "progress.md": progressTemplate(),
    "decisions.md": decisionsTemplate,
    "agents.md": agentsTemplate,
    "rules.md": rulesTemplateFn(threshold),
  };
}

function memoryPath(baseDir: string): string {
  return path.join(baseDir, MEMORY_DIR);
}

export interface EnsureOptions {
  threshold?: number;
  force?: boolean;
  scanResult?: ScanResult;
  gitSummary?: GitSummary;
}

function detectProjectType(scan: ScanResult): ProjectType {
  if (scan.techStack.some((t) => ["React", "Vue", "Svelte", "Next.js", "Nuxt"].includes(t))) {
    return "web";
  }
  if (scan.techStack.some((t) => ["CLI", "Commander"].includes(t)) || scan.packageManager === "npm" && Object.keys(scan.scripts).length > 0 && !scan.techStack.includes("React")) {
    // Heuristic: has scripts but no web framework → likely CLI/lib
    if (scan.entryFile && scan.directories.includes("cli")) return "cli";
  }
  if (scan.directories.includes("lib") || scan.directories.includes("utils")) return "lib";
  return "web";
}

export async function ensureProjectDir(baseDir = process.cwd(), options: EnsureOptions = {}): Promise<void> {
  const { threshold = 60, force = false, scanResult, gitSummary } = options;
  const dir = memoryPath(baseDir);
  await fs.ensureDir(dir);
  await fs.ensureDir(path.join(dir, "checkpoints"));

  const projectType = scanResult ? detectProjectType(scanResult) : "web";
  const templates = buildTemplates(threshold, projectType);

  for (const [filename, content] of Object.entries(templates)) {
    const filePath = path.join(dir, filename);
    if (force || !(await fs.pathExists(filePath))) {
      if (filename === "project.md" && scanResult && !force) {
        await fs.writeFile(filePath, generateProjectFromScan(scanResult), "utf-8");
      } else if (filename === "progress.md" && gitSummary && !force) {
        await fs.writeFile(filePath, generateProgressFromGit(gitSummary), "utf-8");
      } else {
        await fs.writeFile(filePath, content, "utf-8");
      }
    }
  }

  const tasksPath = path.join(dir, "tasks.json");
  if (force || !(await fs.pathExists(tasksPath))) {
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
