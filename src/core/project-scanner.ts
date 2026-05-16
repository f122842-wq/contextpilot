import fs from "fs-extra";
import path from "path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface ScanResult {
  projectName: string;
  techStack: string[];
  directories: string[];
  packageManager: string | null;
  scripts: Record<string, string>;
  dependencies: string[];
  devDependencies: string[];
  entryFile: string | null;
  hasTests: boolean;
  hasDocs: boolean;
}

export interface GitSummary {
  totalCommits: number;
  recentChanges: string[];
  categories: Record<string, number>;
}

const KNOWN_DIRS = [
  "src", "tests", "test", "__tests__", "docs", "doc",
  "api", "components", "hooks", "lib", "utils", "helpers",
  "app", "pages", "routes", "middleware", "services", "models",
  "config", "scripts", "bin", "public", "assets", "styles", "css",
  "prisma", "migrations", "seeds",
];

const STACK_FILES: Record<string, { key: string; extract: (data: unknown) => string[] }> = {
  "package.json": {
    key: "Node.js",
    extract: (data: unknown) => {
      const pkg = data as Record<string, unknown>;
      const stacks: string[] = [];
      if (pkg.dependencies || pkg.devDependencies) {
        const allDeps = { ...(pkg.dependencies as Record<string, string> || {}), ...(pkg.devDependencies as Record<string, string> || {}) };
        if (allDeps.typescript || (pkg.devDependencies as Record<string, string>)?.["typescript"]) stacks.push("TypeScript");
        if (allDeps.react || allDeps["react-dom"]) stacks.push("React");
        if (allDeps.vue) stacks.push("Vue");
        if (allDeps.svelte) stacks.push("Svelte");
        if (allDeps.next) stacks.push("Next.js");
        if (allDeps.nuxt) stacks.push("Nuxt");
        if (allDeps.express) stacks.push("Express");
        if (allDeps.fastify) stacks.push("Fastify");
        if (allDeps["@nestjs/core"]) stacks.push("NestJS");
        if (allDeps.tailwindcss || allDeps["@tailwindcss"]) stacks.push("TailwindCSS");
        if (allDeps.prisma) stacks.push("Prisma");
        if (allDeps.drizzle) stacks.push("Drizzle");
        if (allDeps.vite) stacks.push("Vite");
        if (allDeps.webpack) stacks.push("Webpack");
        if (allDeps.eslint) stacks.push("ESLint");
        if (allDeps.prettier) stacks.push("Prettier");
        if (allDeps.vitest || allDeps.jest) stacks.push("Vitest/Jest");
        if (allDeps.electron) stacks.push("Electron");
        if (allDeps.tauri) stacks.push("Tauri");
        if (allDeps.commander || allDeps.yargs || allDeps.cac || allDeps.clipanion || allDeps.meow) stacks.push("CLI");
        if (!stacks.includes("TypeScript") && !stacks.includes("React") && !stacks.includes("Vue")) {
          stacks.push("JavaScript");
        }
        if ((pkg as Record<string, unknown>).bin) stacks.push("CLI");
      }
      return stacks;
    },
  },
  "go.mod": {
    key: "Go",
    extract: () => ["Go"],
  },
  "Cargo.toml": {
    key: "Rust",
    extract: () => ["Rust"],
  },
  "requirements.txt": {
    key: "Python",
    extract: () => ["Python"],
  },
  "pyproject.toml": {
    key: "Python",
    extract: () => ["Python"],
  },
  "Gemfile": {
    key: "Ruby",
    extract: () => ["Ruby"],
  },
  "composer.json": {
    key: "PHP",
    extract: () => ["PHP"],
  },
};

function detectPackageManager(pkg: Record<string, unknown>, baseDir: string): string | null {
  const hasLock = (name: string) => fs.pathExistsSync(path.join(baseDir, name));
  if (hasLock("pnpm-lock.yaml")) return "pnpm";
  if (hasLock("yarn.lock")) return "yarn";
  if (hasLock("package-lock.json")) return "npm";
  if (hasLock("bun.lockb")) return "bun";
  if (pkg.packageManager) {
    const pm = String(pkg.packageManager).split("@")[0];
    if (pm) return pm;
  }
  return null;
}

export async function scanProject(baseDir: string): Promise<ScanResult> {
  const entries = await fs.readdir(baseDir, { withFileTypes: true });

  let projectName = path.basename(baseDir);
  const techStack: string[] = [];
  const directories: string[] = [];
  let packageManager: string | null = null;
  let scripts: Record<string, string> = {};
  const dependencies: string[] = [];
  const devDependencies: string[] = [];
  let entryFile: string | null = null;
  let hasTests = false;
  let hasDocs = false;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
        if (KNOWN_DIRS.includes(entry.name)) {
          directories.push(entry.name);
        }
      }
      if (entry.name === "tests" || entry.name === "test" || entry.name === "__tests__") {
        hasTests = true;
      }
      if (entry.name === "docs" || entry.name === "doc") {
        hasDocs = true;
      }
    }

    if (entry.isFile()) {
      const filePath = path.join(baseDir, entry.name);

      if (entry.name === "package.json") {
        try {
          const pkg = await fs.readJson(filePath);
          projectName = pkg.name || projectName;
          const handler = STACK_FILES["package.json"];
          if (handler) techStack.push(...handler.extract(pkg));
          packageManager = detectPackageManager(pkg, baseDir);
          scripts = pkg.scripts || {};
          if (pkg.dependencies) {
            for (const dep of Object.keys(pkg.dependencies as Record<string, string>)) {
              if (!dependencies.includes(dep)) dependencies.push(dep);
            }
          }
          if (pkg.devDependencies) {
            for (const dep of Object.keys(pkg.devDependencies as Record<string, string>)) {
              if (!devDependencies.includes(dep)) devDependencies.push(dep);
            }
          }
          if (pkg.main) entryFile = pkg.main as string;
          if ((pkg as Record<string, unknown>).bin && typeof (pkg as Record<string, unknown>).bin === "object") {
            const bin = (pkg as Record<string, unknown>).bin as Record<string, string>;
            entryFile = Object.values(bin)[0] || entryFile;
          }
        } catch { /* skip malformed */ }
      }

      for (const [fileName, handler] of Object.entries(STACK_FILES)) {
        if (entry.name === fileName && fileName !== "package.json") {
          techStack.push(...handler.extract(null));
        }
      }

      if (entry.name === "README.md") hasDocs = true;
      if (entry.name === "vitest.config.ts" || entry.name === "vitest.config.js" ||
          entry.name === "jest.config.ts" || entry.name === "jest.config.js") {
        hasTests = true;
      }
    }
  }

  if (!entryFile && directories.includes("src")) {
    for (const candidate of ["index.ts", "index.js", "main.ts", "main.js", "app.ts", "app.js"]) {
      if (await fs.pathExists(path.join(baseDir, "src", candidate))) {
        entryFile = `src/${candidate}`;
        break;
      }
    }
  }

  return {
    projectName,
    techStack: [...new Set(techStack)],
    directories,
    packageManager,
    scripts,
    dependencies,
    devDependencies,
    entryFile,
    hasTests,
    hasDocs,
  };
}

export async function gitHistorySummary(
  baseDir: string,
  count = 20,
): Promise<GitSummary> {
  const summary: GitSummary = {
    totalCommits: 0,
    recentChanges: [],
    categories: {},
  };

  try {
    const { stdout } = await execAsync(
      `git -C "${baseDir}" log --oneline -n ${count} --no-decorate`,
      { timeout: 5000 },
    );
    const lines = stdout.trim().split("\n").filter(Boolean);
    summary.totalCommits = lines.length;

    for (const line of lines) {
      const msg = line.replace(/^[a-f0-9]+\s+/, "");
      summary.recentChanges.push(msg);

      const matched = msg.match(/^(feat|fix|refactor|docs|test|chore|perf|ci|style|revert)[(:]/);
      if (matched) {
        const cat = matched[1]!;
        summary.categories[cat] = (summary.categories[cat] || 0) + 1;
      } else {
        summary.categories["other"] = (summary.categories["other"] || 0) + 1;
      }
    }
  } catch {
    summary.recentChanges.push("(no git history available)");
  }

  return summary;
}

export function generateProgressFromGit(summary: GitSummary): string {
  const lines = ["# Project Progress", "", "## Current Status"];
  lines.push("**Phase**: ongoing", "**Last Updated**: " + new Date().toISOString().split("T")[0], "");

  lines.push("## Completed (from git history)");
  if (summary.recentChanges.length > 0) {
    for (const change of summary.recentChanges.slice(0, 15)) {
      lines.push(`- ${change}`);
    }
  } else {
    lines.push("_(no git history available)_");
  }

  lines.push("", "## In Progress", "<!-- current work -->", "");
  lines.push("## Blocked", "<!-- blocked items -->", "");
  lines.push("## Next Steps", "<!-- next actions -->", "");

  return lines.join("\n");
}

export function generateProjectFromScan(scan: ScanResult): string {
  const lines = ["# Project Overview", ""];

  lines.push("## Purpose");
  lines.push(`<!-- ${scan.projectName} — ${scan.techStack.join(", ") || "project"} -->`, "");

  lines.push("## Tech Stack");
  if (scan.techStack.length > 0) {
    lines.push(`- ${scan.techStack.join("\n- ")}`);
  } else {
    lines.push("<!-- languages, frameworks, key dependencies -->");
  }
  lines.push("");

  lines.push("## Architecture");
  if (scan.directories.length > 0) {
    lines.push("```");
    for (const dir of scan.directories.sort()) {
      lines.push(`${scan.projectName}/`);
      lines.push(`├── ${dir}/`);
    }
    lines.push("```");
  } else {
    lines.push("<!-- high-level architecture -->");
  }
  lines.push("");

  lines.push("## Package Manager");
  lines.push(scan.packageManager || "<!-- npm | pnpm | yarn -->");
  lines.push("");

  lines.push("## Key Dependencies");
  if (scan.dependencies.length > 0) {
    const top = scan.dependencies.slice(0, 10);
    for (const dep of top) lines.push(`- ${dep}`);
    if (scan.dependencies.length > 10) {
      lines.push(`- ... and ${scan.dependencies.length - 10} more`);
    }
  }
  if (scan.devDependencies.length > 0) {
    lines.push("", "### Dev Dependencies");
    const top = scan.devDependencies.slice(0, 8);
    for (const dep of top) lines.push(`- ${dep}`);
    if (scan.devDependencies.length > 8) {
      lines.push(`- ... and ${scan.devDependencies.length - 8} more`);
    }
  }
  lines.push("");

  lines.push("## Entry Point");
  lines.push(scan.entryFile || "<!-- main entry file -->");
  lines.push("");

  lines.push("## Scripts");
  if (Object.keys(scan.scripts).length > 0) {
    for (const [name, cmd] of Object.entries(scan.scripts)) {
      lines.push(`- \`${name}\`: ${cmd}`);
    }
  } else {
    lines.push("<!-- key scripts from package.json -->");
  }
  lines.push("");

  lines.push("## External Dependencies", "<!-- APIs, services, databases -->");
  lines.push("");

  return lines.join("\n");
}
