export const agentsTemplate = `# Agent Configuration

## Available Agents

| Agent | Role | Model | Priority |
|-------|------|-------|----------|
| Planner | Task decomposition and prioritization | Claude Opus | High |
| Coder | Code implementation | Claude Sonnet | High |
| Reviewer | Code review and quality gates | Claude Sonnet | Medium |
| Recorder | Project memory maintenance | Claude Haiku | Low |

## Agent Collaboration Rules
- Planner runs first to decompose work
- Coder implements one task at a time
- Reviewer checks each completed task
- Recorder updates project docs after each session
`;
