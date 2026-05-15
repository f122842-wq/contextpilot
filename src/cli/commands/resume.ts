import { Command } from "commander";
import { readProjectFile, readTasks } from "../../core/project-memory.js";
import { getLatestCheckpoint } from "../../core/checkpoint.js";
import { createResumePrompt, type AdapterConfig } from "../../core/adapter.js";

async function loadConfig(baseDir: string): Promise<AdapterConfig> {
  const [projectOverview, progress, decisions, tasks, latestCp] = await Promise.all([
    readProjectFile("project.md", baseDir),
    readProjectFile("progress.md", baseDir),
    readProjectFile("decisions.md", baseDir),
    readTasks(baseDir),
    getLatestCheckpoint(baseDir),
  ]);
  return {
    projectOverview,
    progress,
    decisions,
    tasks,
    latestCheckpoint: latestCp?.content ?? null,
  };
}

export async function runResume(baseDir = process.cwd()): Promise<string> {
  const config = await loadConfig(baseDir);
  return createResumePrompt(config);
}

export const resumeCommand = new Command("resume")
  .description("Generate a recovery prompt for a new session")
  .option("--claude", "Use Claude Code adapter format")
  .action(async (options) => {
    const config = await loadConfig(process.cwd());
    if (options.claude) {
      const { createResumePrompt: claudePrompt } = await import(
        "../../adapters/claude-code.js"
      );
      console.log(claudePrompt(config));
    } else {
      console.log(createResumePrompt(config));
    }
  });
