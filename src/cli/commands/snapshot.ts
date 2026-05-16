import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import { format } from "date-fns";
import { MEMORY_DIR, readProjectFile, readTasks } from "../../core/project-memory.js";

async function runSnapshot(baseDir = process.cwd()): Promise<string> {
  const dir = path.join(baseDir, MEMORY_DIR);
  const cpDir = path.join(dir, "checkpoints");
  await fs.ensureDir(cpDir);

  const timestamp = format(new Date(), "yyyy-MM-dd-HH-mm-ss");
  const now = format(new Date(), "yyyy-MM-dd HH:mm");

  let content = [
    "# ContextPilot Snapshot",
    "",
    `**Created**: ${now}`,
    "",
  ];

  // project.md
  content.push("---", "", "## Project Overview", "");
  try { content.push(await readProjectFile("project.md", baseDir), ""); } catch { content.push("_(not available)_", ""); }

  // progress.md
  content.push("---", "", "## Progress", "");
  try { content.push(await readProjectFile("progress.md", baseDir), ""); } catch { content.push("_(not available)_", ""); }

  // decisions.md
  content.push("---", "", "## Decisions", "");
  try { content.push(await readProjectFile("decisions.md", baseDir), ""); } catch { content.push("_(not available)_", ""); }

  // tasks
  content.push("---", "", "## Tasks", "");
  try {
    const tasks = await readTasks(baseDir);
    const stats = {
      done: tasks.filter((t) => t.status === "done").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      pending: tasks.filter((t) => t.status === "pending").length,
      blocked: tasks.filter((t) => t.status === "blocked").length,
    };
    content.push(
      `Total: ${tasks.length} | done: ${stats.done} | in_progress: ${stats.in_progress} | pending: ${stats.pending} | blocked: ${stats.blocked}`,
      "",
    );
    for (const task of tasks) {
      const icon = { done: "✅", in_progress: "🔄", pending: "⬜", blocked: "🚫" }[task.status];
      content.push(`- ${icon} [${task.id}] ${task.title}`);
    }
  } catch {
    content.push("_(not available)_");
  }
  content.push("");

  // agents.md
  content.push("---", "", "## Agent Config", "");
  try { content.push(await readProjectFile("agents.md", baseDir), ""); } catch { content.push("_(not available)_", ""); }

  // rules.md
  content.push("---", "", "## Rules", "");
  try { content.push(await readProjectFile("rules.md", baseDir), ""); } catch { content.push("_(not available)_", ""); }

  const filePath = path.join(cpDir, `${timestamp}.md`);
  await fs.writeFile(filePath, content.join("\n"), "utf-8");
  return filePath;
}

export const snapshotCommand = new Command("snapshot")
  .description("Save a complete project state snapshot (zero config required)")
  .action(async () => {
    const filePath = await runSnapshot();
    console.log(`Snapshot saved: ${filePath}`);
    console.log("Safe to start a new session. Use 'contextpilot resume' to continue.");
  });

export { runSnapshot };
