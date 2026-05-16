import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { runInit } from "../../src/cli/commands/init";

const testWorkspace = path.join(os.tmpdir(), "contextpilot-int-" + Date.now());

beforeEach(async () => {
  await fs.ensureDir(testWorkspace);
});

afterEach(async () => {
  await fs.remove(testWorkspace);
});

describe("init command", () => {
  it("creates .contextpilot directory with all template files", async () => {
    await runInit(testWorkspace);

    const dir = path.join(testWorkspace, ".contextpilot");
    expect(await fs.pathExists(dir)).toBe(true);
    expect(await fs.pathExists(path.join(dir, "project.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "progress.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "decisions.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "tasks.json"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "agents.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "rules.md"))).toBe(true);
    expect(await fs.pathExists(path.join(dir, "checkpoints"))).toBe(true);
  });

  it("is idempotent", async () => {
    await runInit(testWorkspace);
    await runInit(testWorkspace);
    const dir = path.join(testWorkspace, ".contextpilot");
    expect(await fs.pathExists(dir)).toBe(true);
  });
});

describe("init --scan", () => {
  it("detects tech stack and populates project.md", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), {
      name: "my-react-app",
      dependencies: { react: "^18.0.0" },
      devDependencies: { typescript: "^5.0.0", vite: "^5.0.0" },
    });

    const output = await runInit(testWorkspace, { scan: true });
    expect(output).toContain("Detected:");
    expect(output).toContain("React");

    const content = await fs.readFile(
      path.join(testWorkspace, ".contextpilot", "project.md"),
      "utf-8",
    );
    expect(content).toContain("my-react-app");
    expect(content).toContain("TypeScript");
    expect(content).toContain("React");
    expect(content).toContain("Vite");
  });

  it("includes package manager in scan output", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), {
      name: "my-app",
    });
    await fs.writeFile(path.join(testWorkspace, "pnpm-lock.yaml"), "");

    const projectMd = path.join(testWorkspace, ".contextpilot", "project.md");
    // need to remove existing .contextpilot first to ensure scan writes
    await fs.remove(path.join(testWorkspace, ".contextpilot"));

    await runInit(testWorkspace, { scan: true });

    const content = await fs.readFile(projectMd, "utf-8");
    expect(content).toContain("pnpm");
  });

  it("detects directories and includes in project.md", async () => {
    await fs.ensureDir(path.join(testWorkspace, "src"));
    await fs.ensureDir(path.join(testWorkspace, "tests"));
    await fs.writeJson(path.join(testWorkspace, "package.json"), {
      name: "my-app",
      devDependencies: { typescript: "^5.0.0" },
    });

    const projectMd = path.join(testWorkspace, ".contextpilot", "project.md");
    await fs.remove(path.join(testWorkspace, ".contextpilot"));

    await runInit(testWorkspace, { scan: true });

    const content = await fs.readFile(projectMd, "utf-8");
    expect(content).toContain("src/");
    expect(content).toContain("tests/");
  });
});

describe("init --from-git", () => {
  it("generates progress from git history", async () => {
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execAsync = promisify(exec);

    const repoDir = path.join(testWorkspace, "repo");
    await fs.ensureDir(repoDir);
    await execAsync("git init", { cwd: repoDir });
    await execAsync('git config user.email "test@test.com"', { cwd: repoDir });
    await execAsync('git config user.name "Test"', { cwd: repoDir });
    await fs.writeFile(path.join(repoDir, "file.txt"), "hello");
    await execAsync("git add file.txt", { cwd: repoDir });
    await execAsync('git commit -m "feat: initial commit"', { cwd: repoDir });

    const output = await runInit(repoDir, { fromGit: true });
    expect(output).toContain("Git:");
    expect(output).toContain("1 recent commits");

    const content = await fs.readFile(
      path.join(repoDir, ".contextpilot", "progress.md"),
      "utf-8",
    );
    expect(content).toContain("# Project Progress");
    expect(content).toContain("initial commit");
  }, 10000);

  it("handles combined --scan and --from-git", async () => {
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execAsync = promisify(exec);

    const repoDir = path.join(testWorkspace, "repo2");
    await fs.ensureDir(repoDir);
    await execAsync("git init", { cwd: repoDir });
    await execAsync('git config user.email "test@test.com"', { cwd: repoDir });
    await execAsync('git config user.name "Test"', { cwd: repoDir });
    await fs.writeJson(path.join(repoDir, "package.json"), {
      name: "my-cli",
      dependencies: { commander: "^12.0.0" },
      bin: { mycli: "./dist/index.js" },
    });
    await execAsync("git add package.json", { cwd: repoDir });
    await execAsync('git commit -m "feat: add package.json"', { cwd: repoDir });

    const output = await runInit(repoDir, { scan: true, fromGit: true });
    expect(output).toContain("Detected:");
    expect(output).toContain("Git:");

    const projectMd = await fs.readFile(
      path.join(repoDir, ".contextpilot", "project.md"),
      "utf-8",
    );
    expect(projectMd).toContain("my-cli");
    expect(projectMd).toContain("CLI");

    const progressMd = await fs.readFile(
      path.join(repoDir, ".contextpilot", "progress.md"),
      "utf-8",
    );
    expect(progressMd).toContain("add package.json");
  }, 10000);
});
