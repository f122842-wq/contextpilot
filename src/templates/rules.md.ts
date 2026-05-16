export function rulesTemplate(threshold = 60): string {
  return `# ContextPilot Rules

## Context Budget Management

Trigger: when context usage reaches **${threshold}%** of the available window.

If over budget:
- [ ] STOP implementing new features immediately
- [ ] Summarize current goal in one sentence
- [ ] Summarize completed changes since last checkpoint
- [ ] List remaining unfinished tasks
- [ ] Record key design decisions made
- [ ] Update \`.contextpilot/progress.md\`
- [ ] Update \`.contextpilot/tasks.json\`
- [ ] Run \`contextpilot snapshot\`
- [ ] Prompt user to start a new session with \`contextpilot resume\`

## Session Start

At the start of every new session, read in order:
- [ ] \`.contextpilot/project.md\` — understand what and why
- [ ] \`.contextpilot/progress.md\` — know current phase and completed work
- [ ] \`.contextpilot/decisions.md\` — know past design choices
- [ ] \`.contextpilot/tasks.json\` — know task status and dependencies
- [ ] The latest file in \`.contextpilot/checkpoints/\` — most recent state snapshot

## Rules

- [ ] Never re-design confirmed architecture
- [ ] If documentation and code diverge, report the discrepancy first
- [ ] Update progress.md after each completed task
`;
}

