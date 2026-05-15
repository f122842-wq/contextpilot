import { Command } from "commander";
import { ensureProjectDir } from "../../core/project-memory.js";

export async function runInit(baseDir = process.cwd()): Promise<void> {
  await ensureProjectDir(baseDir);
}

export const initCommand = new Command("init")
  .description("Initialize .contextpilot/ project memory directory")
  .action(async () => {
    await runInit();
    console.log("ContextPilot initialized successfully.");
    console.log("Created .contextpilot/ with project memory templates.");
  });
