export const rulesTemplate = `# ContextPilot Rules

## Context Budget Management

When the context usage reaches or exceeds **60%** of the available window:

1. **STOP** implementing new features immediately.
2. **Summarize** the current goal.
3. **Summarize** completed changes.
4. **Summarize** remaining uncompleted tasks.
5. **Summarize** key design decisions made.
6. **Update** \`.contextpilot/progress.md\`.
7. **Update** \`.contextpilot/tasks.json\`.
8. **Create** checkpoint at \`.contextpilot/checkpoints/YYYY-MM-DD-HH-mm.md\`.
9. **Prompt** the user to start a new session with \`contextpilot resume\`.

## Session Start Protocol

At the start of every new session, the AI MUST read in order:
1. \`.contextpilot/project.md\`
2. \`.contextpilot/progress.md\`
3. \`.contextpilot/decisions.md\`
4. \`.contextpilot/tasks.json\`
5. The latest checkpoint file

DO NOT re-design confirmed architecture. If documentation and code diverge, report the discrepancy first.
`;
