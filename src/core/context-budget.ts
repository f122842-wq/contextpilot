/**
 * Estimate context usage ratio based on character count.
 * Rough heuristic: 1 token ≈ 4 characters.
 */
export function estimateUsage(
  contextText: string,
  maxTokens: number,
): number {
  if (!contextText || maxTokens <= 0) return 0;
  const estimatedTokens = contextText.length / 4;
  return estimatedTokens / maxTokens;
}

export function isOverThreshold(
  contextText: string,
  maxTokens: number,
  threshold = 0.6,
): boolean {
  return estimateUsage(contextText, maxTokens) >= threshold;
}

export function formatUsageReport(
  contextText: string,
  maxTokens: number,
  threshold = 0.6,
): string {
  const usage = estimateUsage(contextText, maxTokens);
  const pct = (usage * 100).toFixed(1);
  const over = usage >= threshold;

  const lines = [
    `Context usage: ${pct}% (threshold: ${(threshold * 100).toFixed(0)}%)`,
    `Estimated tokens: ~${Math.round(contextText.length / 4)} / ${maxTokens}`,
  ];

  if (over) {
    lines.push("");
    lines.push("⚠ WARNING: Context budget exceeded!");
    lines.push("Consider running 'contextpilot checkpoint' to save state,");
    lines.push("then start a new session with 'contextpilot resume'.");
  }

  return lines.join("\n");
}
