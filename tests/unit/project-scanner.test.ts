import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import {
  scanProject,
  generateProjectFromScan,
  generateProgressFromGit,
  gitHistorySummary,
} from "../../src/core/project-scanner";
import type { ScanResult, GitSummary } from "../../src/core/project-scanner";

const testWorkspace = path.join(os.tmpdir(), "cp-scanner-" + Date.now());

beforeEach(async () => {
  await fs.ensureDir(testWorkspace);
});

afterEach(async () => {
  await fs.remove(testWorkspace);
});

describe("scanProject", () => {
  it("detects project name from directory", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), { name: "my-app" });
    const result = await scanProject(testWorkspace);
    expect(result.projectName).toBe("my-app");
  });

  it("falls back to directory name when package.json has no name", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), {});
    const result = await scanProject(testWorkspace);
    expect(result.projectName).toBe(path.basename(testWorkspace));
  });

  it("detects TypeScript from devDependencies", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), {
      name: "ts-app",
      devDependencies: { typescript: "^5.0.0" },
    });
    const result = await scanProject(testWorkspace);
    expect(result.techStack).toContain("TypeScript");
  });

  it("detects React project", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), {
      name: "react-app",
      dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
    });
    const result = await scanProject(testWorkspace);
    expect(result.techStack).toContain("React");
  });

  it("detects CLI tools from dependencies", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), {
      name: "my-cli",
      dependencies: { commander: "^12.0.0" },
      bin: { mycli: "./dist/index.js" },
    });
    const result = await scanProject(testWorkspace);
    expect(result.techStack).toContain("CLI");
  });

  it("detects Go project from go.mod", async () => {
    await fs.writeFile(path.join(testWorkspace, "go.mod"), "module example.com/app\n\ngo 1.21\n");
    const result = await scanProject(testWorkspace);
    expect(result.techStack).toContain("Go");
  });

  it("detects Rust project from Cargo.toml", async () => {
    await fs.writeFile(path.join(testWorkspace, "Cargo.toml"), '[package]\nname = "my-crate"\n');
    const result = await scanProject(testWorkspace);
    expect(result.techStack).toContain("Rust");
  });

  it("detects Python project from requirements.txt", async () => {
    await fs.writeFile(path.join(testWorkspace, "requirements.txt"), "flask\n");
    const result = await scanProject(testWorkspace);
    expect(result.techStack).toContain("Python");
  });

  it("detects Python project from pyproject.toml", async () => {
    await fs.writeFile(path.join(testWorkspace, "pyproject.toml"), "[project]\nname = \"my-pkg\"\n");
    const result = await scanProject(testWorkspace);
    expect(result.techStack).toContain("Python");
  });

  it("detects known directories", async () => {
    await fs.ensureDir(path.join(testWorkspace, "src"));
    await fs.ensureDir(path.join(testWorkspace, "tests"));
    await fs.ensureDir(path.join(testWorkspace, "components"));
    await fs.ensureDir(path.join(testWorkspace, "node_modules")); // should be excluded
    await fs.ensureDir(path.join(testWorkspace, ".git")); // should be excluded
    const result = await scanProject(testWorkspace);
    expect(result.directories).toContain("src");
    expect(result.directories).toContain("tests");
    expect(result.directories).toContain("components");
    expect(result.directories).not.toContain("node_modules");
    expect(result.directories).not.toContain(".git");
  });

  it("marks hasTests true when tests directory exists", async () => {
    await fs.ensureDir(path.join(testWorkspace, "tests"));
    const result = await scanProject(testWorkspace);
    expect(result.hasTests).toBe(true);
  });

  it("marks hasTests true when __tests__ directory exists", async () => {
    await fs.ensureDir(path.join(testWorkspace, "__tests__"));
    const result = await scanProject(testWorkspace);
    expect(result.hasTests).toBe(true);
  });

  it("marks hasTests true when vitest.config.ts exists", async () => {
    await fs.writeFile(path.join(testWorkspace, "vitest.config.ts"), "");
    const result = await scanProject(testWorkspace);
    expect(result.hasTests).toBe(true);
  });

  it("detects hasDocs from README.md", async () => {
    await fs.writeFile(path.join(testWorkspace, "README.md"), "# Hello");
    const result = await scanProject(testWorkspace);
    expect(result.hasDocs).toBe(true);
  });

  it("detects hasDocs from docs directory", async () => {
    await fs.ensureDir(path.join(testWorkspace, "docs"));
    const result = await scanProject(testWorkspace);
    expect(result.hasDocs).toBe(true);
  });

  it("detects package manager from lock files", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), { name: "app" });
    await fs.writeFile(path.join(testWorkspace, "pnpm-lock.yaml"), "");
    const result = await scanProject(testWorkspace);
    expect(result.packageManager).toBe("pnpm");
  });

  it("extracts scripts from package.json", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), {
      name: "app",
      scripts: { build: "tsc", test: "vitest" },
    });
    const result = await scanProject(testWorkspace);
    expect(result.scripts).toEqual({ build: "tsc", test: "vitest" });
  });

  it("extracts dependencies from package.json", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), {
      name: "app",
      dependencies: { commander: "^12.0.0", "fs-extra": "^11.0.0" },
      devDependencies: { vitest: "^1.0.0" },
    });
    const result = await scanProject(testWorkspace);
    expect(result.dependencies).toContain("commander");
    expect(result.dependencies).toContain("fs-extra");
    expect(result.devDependencies).toContain("vitest");
  });

  it("detects entry file from bin field", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), {
      name: "cli-app",
      bin: { cli: "./dist/index.js" },
    });
    const result = await scanProject(testWorkspace);
    expect(result.entryFile).toBe("./dist/index.js");
  });

  it("detects entry file from main field", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), {
      name: "lib",
      main: "./dist/index.js",
    });
    const result = await scanProject(testWorkspace);
    expect(result.entryFile).toBe("./dist/index.js");
  });

  it("detects entry file by scanning src/ directory", async () => {
    await fs.ensureDir(path.join(testWorkspace, "src"));
    await fs.writeFile(path.join(testWorkspace, "src", "index.ts"), "");
    const result = await scanProject(testWorkspace);
    expect(result.entryFile).toBe("src/index.ts");
  });

  it("handles empty directory gracefully", async () => {
    const result = await scanProject(testWorkspace);
    expect(result.projectName).toBe(path.basename(testWorkspace));
    expect(result.techStack).toEqual([]);
    expect(result.directories).toEqual([]);
    expect(result.packageManager).toBeNull();
    expect(result.dependencies).toEqual([]);
    expect(result.devDependencies).toEqual([]);
  });

  it("handles malformed package.json gracefully", async () => {
    await fs.writeFile(path.join(testWorkspace, "package.json"), "{ not valid json }");
    const result = await scanProject(testWorkspace);
    expect(result.projectName).toBe(path.basename(testWorkspace));
  });

  it("deduplicates tech stack entries", async () => {
    await fs.writeJson(path.join(testWorkspace, "package.json"), {
      name: "app",
      dependencies: { commander: "^12.0.0", eslint: "^8.0.0", prettier: "^3.0.0" },
      bin: { app: "./dist/index.js" },
    });
    const result = await scanProject(testWorkspace);
    // "CLI" should appear only once (from commander + bin)
    const cliCount = result.techStack.filter((t) => t === "CLI").length;
    expect(cliCount).toBe(1);
  });
});

describe("gitHistorySummary", () => {
  it("returns empty summary for non-git directory", async () => {
    const summary = await gitHistorySummary(testWorkspace);
    expect(summary.totalCommits).toBe(0);
    expect(summary.recentChanges).toContain("(no git history available)");
  });

  it("returns summary from a real git repo", async () => {
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
    await fs.writeFile(path.join(repoDir, "file.txt"), "hello world");
    await execAsync("git add file.txt", { cwd: repoDir });
    await execAsync('git commit -m "fix: update greeting"', { cwd: repoDir });

    const summary = await gitHistorySummary(repoDir, 10);
    expect(summary.totalCommits).toBe(2);
    expect(summary.recentChanges.some((m) => m.includes("update greeting"))).toBe(true);
    expect(summary.categories.feat).toBe(1);
    expect(summary.categories.fix).toBe(1);
  }, 10000);
});

describe("generateProgressFromGit", () => {
  it("generates progress from git summary", () => {
    const summary: GitSummary = {
      totalCommits: 3,
      recentChanges: ["feat: add auth", "fix: login bug", "docs: update readme"],
      categories: { feat: 1, fix: 1, docs: 1 },
    };
    const output = generateProgressFromGit(summary);
    expect(output).toContain("# Project Progress");
    expect(output).toContain("add auth");
    expect(output).toContain("login bug");
    expect(output).toContain("update readme");
  });

  it("handles empty git history", () => {
    const summary: GitSummary = {
      totalCommits: 0,
      recentChanges: ["(no git history available)"],
      categories: {},
    };
    const output = generateProgressFromGit(summary);
    expect(output).toContain("(no git history available)");
  });

  it("includes today's date", () => {
    const summary: GitSummary = {
      totalCommits: 0,
      recentChanges: [],
      categories: {},
    };
    const output = generateProgressFromGit(summary);
    const today = new Date().toISOString().split("T")[0];
    expect(output).toContain(today);
  });
});

describe("generateProjectFromScan", () => {
  it("generates project overview with tech stack", () => {
    const scan: ScanResult = {
      projectName: "my-app",
      techStack: ["TypeScript", "React", "Vite"],
      directories: ["src", "tests", "components"],
      packageManager: "pnpm",
      scripts: { dev: "vite", build: "tsc && vite build" },
      dependencies: ["react", "react-dom"],
      devDependencies: ["typescript", "vite", "vitest"],
      entryFile: "src/index.ts",
      hasTests: true,
      hasDocs: true,
    };
    const output = generateProjectFromScan(scan);
    expect(output).toContain("# Project Overview");
    expect(output).toContain("my-app");
    expect(output).toContain("TypeScript");
    expect(output).toContain("React");
    expect(output).toContain("pnpm");
    expect(output).toContain("src/index.ts");
  });

  it("handles empty scan result with placeholders", () => {
    const scan: ScanResult = {
      projectName: "empty",
      techStack: [],
      directories: [],
      packageManager: null,
      scripts: {},
      dependencies: [],
      devDependencies: [],
      entryFile: null,
      hasTests: false,
      hasDocs: false,
    };
    const output = generateProjectFromScan(scan);
    expect(output).toContain("# Project Overview");
    expect(output).toContain("empty");
  });

  it("includes architecture diagram from directories", () => {
    const scan: ScanResult = {
      projectName: "my-app",
      techStack: ["TypeScript"],
      directories: ["src", "tests", "lib"],
      packageManager: "npm",
      scripts: {},
      dependencies: [],
      devDependencies: [],
      entryFile: null,
      hasTests: true,
      hasDocs: false,
    };
    const output = generateProjectFromScan(scan);
    expect(output).toContain("my-app/");
    expect(output).toContain("├── lib/");
    expect(output).toContain("├── src/");
    expect(output).toContain("├── tests/");
  });

  it("truncates long dependency lists with count", () => {
    const deps: string[] = [];
    for (let i = 0; i < 15; i++) {
      deps.push(`dep-${i}`);
    }
    const scan: ScanResult = {
      projectName: "big-app",
      techStack: ["Node.js"],
      directories: [],
      packageManager: "npm",
      scripts: {},
      dependencies: deps,
      devDependencies: [],
      entryFile: null,
      hasTests: false,
      hasDocs: false,
    };
    const output = generateProjectFromScan(scan);
    expect(output).toContain("and 5 more");
  });

  it("includes scripts section", () => {
    const scan: ScanResult = {
      projectName: "app",
      techStack: ["TypeScript"],
      directories: [],
      packageManager: "npm",
      scripts: { build: "tsc", test: "vitest run" },
      dependencies: [],
      devDependencies: [],
      entryFile: null,
      hasTests: false,
      hasDocs: false,
    };
    const output = generateProjectFromScan(scan);
    expect(output).toContain("`build`: tsc");
    expect(output).toContain("`test`: vitest run");
  });
});
