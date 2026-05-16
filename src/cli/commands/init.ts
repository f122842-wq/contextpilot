import { Command } from "commander";
import { ensureProjectDir } from "../../core/project-memory.js";
import { resolveThreshold } from "../../core/config.js";
import type { ScanResult, GitSummary } from "../../core/project-scanner.js";

export async function runInit(
  baseDir = process.cwd(),
  options: { threshold?: number; scan?: boolean; fromGit?: boolean; force?: boolean } = {},
): Promise<string> {
  const threshold = resolveThreshold(options.threshold);
  let scanResult: ScanResult | undefined;
  let gitSummary: GitSummary | undefined;

  if (options.scan || options.fromGit) {
    try {
      const { scanProject, gitHistorySummary } = await import(
        "../../core/project-scanner.js"
      );
      if (options.scan) {
        scanResult = await scanProject(baseDir);
      }
      if (options.fromGit) {
        gitSummary = await gitHistorySummary(baseDir);
      }
    } catch {
      // scan skipped silently
    }
  }

  await ensureProjectDir(baseDir, {
    threshold,
    force: options.force,
    scanResult,
    gitSummary,
  });

  const messages: string[] = [];

  if (scanResult) {
    messages.push(`Detected: ${scanResult.techStack.join(", ") || "unknown stack"}`);
    messages.push(`Structure: ${scanResult.directories.sort().join(", ") || "flat"}`);
  }
  if (gitSummary) {
    messages.push(`Git: ${gitSummary.totalCommits} recent commits analyzed`);
  }
  messages.push(`Context threshold: ${threshold}%`);
  messages.push("Created .contextpilot/ with project memory files.");
  return messages.join("\n");
}

export const initCommand = new Command("init")
  .description("Initialize .contextpilot/ project memory directory")
  .option("--threshold <number>", "Context budget threshold percentage (default: 60)", "60")
  .option("--scan", "Auto-detect tech stack and project structure")
  .option("--from-git", "Generate progress summary from git history")
  .option("--force", "Overwrite existing .contextpilot/ files")
  .action(async (options) => {
    const output = await runInit(process.cwd(), {
      threshold: Number(options.threshold),
      scan: options.scan,
      fromGit: options.fromGit,
      force: options.force,
    });
    console.log(output);
  });
