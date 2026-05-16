export type ProjectType = "web" | "cli" | "lib";

export function projectTemplate(type: ProjectType = "web"): string {
  const sections: Record<ProjectType, string> = {
    web: [
      "## Frontend",
      "<!-- framework, UI library, state management -->",
      "",
      "## Backend",
      "<!-- API framework, database, auth -->",
      "",
      "## Database",
      "<!-- database type, ORM, migrations -->",
      "",
      "## Deployment",
      "<!-- hosting, CI/CD, environment -->",
    ].join("\n"),

    cli: [
      "## Commands",
      "<!-- list of CLI commands and their purpose -->",
      "",
      "## Options & Flags",
      "<!-- key configuration options -->",
      "",
      "## Output & Formatting",
      "<!-- stdout, files, error handling approach -->",
      "",
      "## Distribution",
      "<!-- npm, binary, docker -->",
    ].join("\n"),

    lib: [
      "## API Surface",
      "<!-- public functions, classes, types -->",
      "",
      "## Installation",
      "<!-- how users install: npm install, go get, etc. -->",
      "",
      "## Usage Example",
      "<!-- minimal working example -->",
      "",
      "## Error Handling",
      "<!-- error types, how callers handle errors -->",
    ].join("\n"),
  };

  return `# Project Overview

## Purpose
<!-- What does this project do? What problem does it solve? -->

## Tech Stack
<!-- Languages, frameworks, key dependencies -->

${sections[type]}

## Key Conventions
<!-- Naming conventions, code style, patterns used -->

## External Dependencies
<!-- APIs, services, databases this project depends on -->
`;
}
