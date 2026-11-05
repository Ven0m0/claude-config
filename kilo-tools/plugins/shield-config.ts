import * as fs from "node:fs";
import * as path from "node:path";

export interface ShieldConfig {
  enabled: boolean;
  readLimit: number;
  compactThresholdBytes: number;
  compactTargetBytes: number;
}

const STATE_DIR = ".kilo/state";
const CONFIG_FILE = "context-shield.json";
const CACHE_TTL_MS = 5_000;

export const DEFAULT_CONFIG: ShieldConfig = {
  enabled: true,
  readLimit: 800,
  compactThresholdBytes: 6 * 1024,
  compactTargetBytes: 2 * 1024,
};

// A non-number ("800", null, NaN) falls back to the default instead of becoming NaN, which would
// make every size comparison false and silently disable the limit.
const clamp = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(Math.max(value, min), max) : fallback;

// Pure: file text (or undefined when missing) to a validated config. Bad JSON falls back to defaults.
export function parseConfig(text: string | undefined): ShieldConfig {
  if (text === undefined) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_CONFIG.enabled,
      readLimit: clamp(parsed.readLimit, DEFAULT_CONFIG.readLimit, 50, 2000),
      compactThresholdBytes: clamp(parsed.compactThresholdBytes, DEFAULT_CONFIG.compactThresholdBytes, 2048, 256000),
      compactTargetBytes: clamp(parsed.compactTargetBytes, DEFAULT_CONFIG.compactTargetBytes, 1024, 64000),
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

// Per-instance store: the config file under `<directory>/.kilo/state`, cached for a few seconds
// so hooks do not hit the disk on every tool call. Out-of-process edits show up after the TTL.
export function createConfigStore(directory: string) {
  const file = path.join(directory, STATE_DIR, CONFIG_FILE);
  let cached: { config: ShieldConfig; expiresAt: number } | undefined;

  return {
    read(): ShieldConfig {
      const now = Date.now();
      if (cached && now < cached.expiresAt) return cached.config;
      const config = parseConfig(fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : undefined);
      cached = { config, expiresAt: now + CACHE_TTL_MS };
      return config;
    },
    write(config: ShieldConfig): void {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(config, null, 2));
      cached = undefined;
    },
  };
}
