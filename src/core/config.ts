export interface InitOptions {
  threshold?: number;
  scan?: boolean;
  fromGit?: boolean;
}

export function resolveThreshold(raw: unknown, fallback = 60): number {
  if (typeof raw === "number" && raw > 0 && raw <= 100) return raw;
  const parsed = Number(raw);
  if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 100) return parsed;
  return fallback;
}

export function parseThresholdFromRules(rulesContent: string): number {
  const match = rulesContent.match(/(\d+)%/);
  if (match?.[1]) {
    const n = Number(match[1]);
    if (n > 0 && n <= 100) return n;
  }
  return 60;
}
