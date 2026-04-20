import type { Plugin } from '@opencode-ai/plugin';

function deduplicateLines(lines: string[]): string[] {
  const counts = new Map<string, number>();
  for (const l of lines) {
    counts.set(l, (counts.get(l) ?? 0) + 1);
  }
  const result: string[] = [];
  for (const [line, count] of counts) {
    result.push(count > 1 ? `${line} (x${count})` : line);
  }
  return result;
}

function truncate(text: string, maxLines: number, keepHead = 20, keepTail = 20): string {
  const lines = text.split('\n');
  if (lines.length <= maxLines) return text;
  const head = lines.slice(0, keepHead);
  const tail = lines.slice(-keepTail);
  const omitted = lines.length - keepHead - keepTail;
  return [...head, `... ${omitted} lines omitted ...`, ...tail].join('\n');
}

function stripAnsi(text: string): string {
  return text.replace(new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'), '');
}

function collapseWhitespace(text: string): string {
  return text.replace(/[ \t]+/g, ' ').replace(/^[ \t]+/, '');
}

interface FilterResult {
  output: string;
  compacted: boolean;
}

function filterGitStatus(output: string): FilterResult {
  const lines = output.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return { output: 'clean', compacted: true };

  const added: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];
  const untracked: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('??')) untracked.push(trimmed.slice(2).trim());
    else if (trimmed.startsWith('A ')) added.push(trimmed.slice(2).trim());
    else if (trimmed.startsWith('M ') || trimmed.startsWith('MM')) modified.push(trimmed.slice(2).trim());
    else if (trimmed.startsWith('D ')) deleted.push(trimmed.slice(2).trim());
  }

  const parts: string[] = [];
  if (added.length) parts.push(`added: ${added.length}`);
  if (modified.length) parts.push(`modified: ${modified.length}`);
  if (deleted.length) parts.push(`deleted: ${deleted.length}`);
  if (untracked.length) parts.push(`untracked: ${untracked.length}`);

  return { output: parts.join(', ') || 'clean', compacted: true };
}

function filterGitLog(output: string): FilterResult {
  const lines = output.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return { output: '(empty)', compacted: true };

  const commits: string[] = [];
  for (const line of lines) {
    const match = line.match(/^commit\s+([a-f0-9]+)/);
    if (match) {
      const short = match[1].slice(0, 7);
      commits.push(short);
    }
  }

  if (commits.length > 0) {
    return {
      output: `${commits.length} commit(s): ${commits.slice(0, 5).join(', ')}${commits.length > 5 ? '...' : ''}`,
      compacted: true,
    };
  }

  return { output: truncate(output, 30), compacted: lines.length > 30 };
}

function filterGitDiff(output: string): FilterResult {
  const lines = output.split('\n');
  let additions = 0;
  let deletions = 0;
  const files: string[] = [];

  for (const line of lines) {
    if (line.startsWith('+++ b/')) files.push(line.slice(6));
    else if (line.startsWith('+') && !line.startsWith('+++')) additions++;
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
  }

  if (files.length > 0) {
    return {
      output: `${files.length} file(s) changed, +${additions}/-${deletions}\n${files.map((f) => `  ${f}`).join('\n')}`,
      compacted: true,
    };
  }

  return { output: 'no changes', compacted: true };
}

function filterLs(output: string): FilterResult {
  const lines = output.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return { output: '(empty)', compacted: true };

  const byExt = new Map<string, number>();
  let dirs = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.endsWith('/')) {
      dirs++;
    } else {
      const ext = trimmed.includes('.') ? (trimmed.split('.').pop() ?? '(none)') : '(none)';
      byExt.set(ext, (byExt.get(ext) ?? 0) + 1);
    }
  }

  const parts: string[] = [];
  if (dirs) parts.push(`${dirs} dir(s)`);
  for (const [ext, count] of [...byExt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    parts.push(`${count} .${ext}`);
  }

  return { output: parts.join(', '), compacted: true };
}

function filterCat(output: string, maxLines = 200): FilterResult {
  const lines = output.split('\n');
  if (lines.length <= maxLines) return { output, compacted: false };

  const head = lines.slice(0, 50);
  const tail = lines.slice(-50);
  const omitted = lines.length - 100;

  return {
    output: [...head, `\n... ${omitted} lines omitted (use read with offset/limit for more) ...`, ...tail].join('\n'),
    compacted: true,
  };
}

function filterTestOutput(output: string): FilterResult {
  const stripped = stripAnsi(output);
  const lines = stripped.split('\n');

  const failures: string[] = [];
  let passed = 0;
  let failed = 0;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('fail') || lower.includes('error') || lower.includes('panic')) {
      if (line.trim()) failures.push(collapseWhitespace(line.trim()));
    }
    if (lower.includes('passed')) {
      const m = line.match(/(\d+)\s*passed/);
      if (m) passed += parseInt(m[1], 10);
    }
    if (lower.includes('failed')) {
      const m = line.match(/(\d+)\s*failed/);
      if (m) failed += parseInt(m[1], 10);
    }
  }

  const uniqueFailures = deduplicateLines(failures.filter((l) => !l.includes('passed') && !l.includes('test result')));

  const summary: string[] = [];
  if (failed > 0) summary.push(`FAILED: ${failed}/${passed + failed} tests`);
  else if (passed > 0) summary.push(`PASSED: ${passed} tests`);

  if (uniqueFailures.length > 0) {
    summary.push('', 'Failures:', ...uniqueFailures.slice(0, 20));
    if (uniqueFailures.length > 20) summary.push(`  ... and ${uniqueFailures.length - 20} more`);
  }

  return { output: summary.join('\n') || stripped, compacted: summary.length > 0 };
}

function filterLintOutput(output: string): FilterResult {
  const stripped = stripAnsi(output);
  const lines = stripped.split('\n').filter((l) => l.trim());

  const byRule = new Map<string, string[]>();
  for (const line of lines) {
    const match = line.match(/(\S+)\s*[:(]/);
    const rule = match ? match[1] : 'other';
    const existing = byRule.get(rule) ?? [];
    existing.push(collapseWhitespace(line));
    byRule.set(rule, existing);
  }

  const parts: string[] = [];
  for (const [rule, msgs] of byRule) {
    parts.push(`${rule}: ${msgs.length} issue(s)`);
    for (const msg of msgs.slice(0, 3)) {
      parts.push(`  ${msg}`);
    }
    if (msgs.length > 3) parts.push(`  ... and ${msgs.length - 3} more`);
  }

  return { output: parts.join('\n') || stripped, compacted: parts.length > 0 };
}

function filterBuildOutput(output: string): FilterResult {
  const stripped = stripAnsi(output);
  const lines = stripped.split('\n');

  const errors: string[] = [];
  const warnings: string[] = [];
  let success = false;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('error')) errors.push(collapseWhitespace(line.trim()));
    else if (lower.includes('warning')) warnings.push(collapseWhitespace(line.trim()));
    else if (lower.includes('finished') || lower.includes('success') || lower.includes('built')) success = true;
  }

  const parts: string[] = [];
  if (errors.length > 0) {
    parts.push(`BUILD FAILED: ${errors.length} error(s)`);
    for (const e of errors.slice(0, 10)) parts.push(`  ${e}`);
    if (errors.length > 10) parts.push(`  ... and ${errors.length - 10} more`);
  } else if (warnings.length > 0) {
    parts.push(`Built with ${warnings.length} warning(s)`);
    for (const w of warnings.slice(0, 5)) parts.push(`  ${w}`);
  } else if (success) {
    parts.push('BUILD SUCCESS');
  }

  return { output: parts.join('\n') || stripped, compacted: parts.length > 0 };
}

function filterDockerPs(output: string): FilterResult {
  const lines = output.split('\n').filter((l) => l.trim());
  if (lines.length <= 1) return { output: '(no containers)', compacted: true };

  const containers = lines.slice(1);
  const running = containers.filter((l) => l.includes('Up')).length;
  const exited = containers.filter((l) => l.includes('Exited')).length;

  return {
    output: `${containers.length} container(s): ${running} running, ${exited} stopped`,
    compacted: true,
  };
}

interface CommandFilter {
  pattern: RegExp;
  filter: (output: string, args: string[]) => FilterResult;
}

const COMMAND_FILTERS: CommandFilter[] = [
  { pattern: /^git\s+status/, filter: filterGitStatus },
  { pattern: /^git\s+log/, filter: filterGitLog },
  { pattern: /^git\s+diff/, filter: filterGitDiff },
  { pattern: /^(ls|dir|eza|fd)\b/, filter: filterLs },
  { pattern: /^(cat|head|tail|less|more|bat)\b/, filter: (out) => filterCat(out) },
  {
    pattern: /(jest|vitest|pytest|cargo\s+test|go\s+test|npm\s+test|yarn\s+test|bun\s+test)/,
    filter: filterTestOutput,
  },
  { pattern: /(eslint|ruff|clippy|golangci-lint|tsc\s+--noEmit)/, filter: filterLintOutput },
  { pattern: /(cargo\s+build|cargo\s+clippy|npm\s+run\s+build|next\s+build)/, filter: filterBuildOutput },
  { pattern: /^docker\s+ps/, filter: filterDockerPs },
];

function getFilter(command: string): ((output: string, args: string[]) => FilterResult) | null {
  for (const cf of COMMAND_FILTERS) {
    if (cf.pattern.test(command)) return cf.filter;
  }
  return null;
}

export const OpenCodeRtkPlugin: Plugin = async () => {
  return {
    'tool.execute.after': async (input, output) => {
      if (input.tool !== 'bash') return;

      const payload = output as { output?: string; metadata?: unknown };
      const rawOutput = typeof payload.output === 'string' ? payload.output : '';
      if (!rawOutput || rawOutput.length < 500) return;

      const command =
        typeof (payload.metadata as Record<string, unknown> | undefined)?.command === 'string'
          ? (payload.metadata as Record<string, unknown>).command
          : '';

      if (!command) return;

      const filterFn = getFilter(command);
      if (!filterFn) return;

      const parts = command.split(/\s+/);
      const args = parts.slice(1);

      try {
        const result = filterFn(rawOutput, args);
        if (result.compacted) {
          payload.output = result.output;
          payload.metadata = {
            ...(payload.metadata ?? {}),
            rtk: { compacted: true, originalLength: rawOutput.length, compactedLength: result.output.length },
          };
        }
      } catch (e) {
        console.error('RTK compaction error:', e);
      }
    },
  };
};

export default OpenCodeRtkPlugin;
