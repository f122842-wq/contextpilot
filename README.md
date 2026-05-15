# ContextPilot

AI coding assistant project memory manager — prevents context decay in long projects.

## The Problem

AI coding assistants (Claude Code, Cursor, Codex) get progressively worse in long projects:
- Context window fills up, response quality drops
- Design rationale gets forgotten across sessions
- Same files get re-read, wasting tokens
- New sessions require manual re-explanation
- Multi-agent conclusions are lost without persistence
- Project docs (README, TODO) drift from actual code state

## The Solution

ContextPilot maintains an **external project memory** that AI assistants can read and write. It turns a "single-session assistant" into a **continuous project execution system**.

## Quick Start

```bash
npm install -g contextpilot
cd your-project

# Initialize project memory
contextpilot init

# Check project status
contextpilot status

# Save context before starting a new session
contextpilot checkpoint

# Resume work in a new session
contextpilot resume

# Get next task suggestions
contextpilot plan
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Create `.contextpilot/` directory with templates |
| `status` | Display current project state (tasks, progress, decisions) |
| `checkpoint` | Save a context snapshot for session handoff |
| `resume` | Generate a recovery prompt for a new AI session |
| `plan` | Show next available tasks (dependencies satisfied) |

## Project Memory Structure

```
.contextpilot/
├── project.md       # Project overview and architecture
├── progress.md      # Current status, completed, in-progress, blocked
├── decisions.md     # Design decisions and rationale
├── tasks.json       # Task graph with dependencies and status
├── agents.md        # Multi-agent configuration
├── rules.md         # Context budget rules and session protocols
└── checkpoints/     # Timestamped context snapshots
```

## Context Budget Management

When context exceeds **60%**, the rules system instructs the AI to:
1. Stop implementing new features
2. Summarize current state
3. Update all project memory files
4. Create a checkpoint
5. Prompt for a new session with `contextpilot resume`

## Development

```bash
npm install
npm run dev        # Run with tsx
npm test           # Run tests (vitest)
npm run test:coverage  # Coverage report
npm run build      # Production build (tsup)
npm run typecheck  # TypeScript check
```
