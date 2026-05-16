export function progressTemplate(): string {
  return `# Project Progress

## Current Status
**Phase**: <!-- current phase -->
**Last Updated**: <!-- date -->

## Completed
<!-- List completed tasks/features -->
<!--
- [x] Feature X — 2025-01-01
- [x] Bug fix Y — 2025-01-02
-->

## In Progress
<!-- What is currently being worked on -->
<!--
- [ ] Feature Z — started 2025-01-03
-->

## Blocked
<!-- Tasks blocked and why -->
<!--
- [ ] Feature W — blocked by: dependency not yet released
-->

## Next Steps
<!-- Prioritized next actions -->
<!--
1. Finish Feature Z
2. Review PR #42
3. Release v1.2.0
-->
`;
}
