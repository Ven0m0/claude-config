#!/usr/bin/env npx ts-node

/**
 * CLAUDE.md Analyzer
 *
 * Performs deterministic analysis of CLAUDE.md files, outputting JSON metrics
 * that can be used for scoring. This keeps AI tokens free for judgment work.
 *
 * Usage:
 *   npx ts-node analyze.ts <path-to-claudemd>
 *   npx ts-node analyze.ts ./CLAUDE.md
 *   npx ts-node analyze.ts ~/.claude/CLAUDE.md
 *
 * Output: JSON object with metrics
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface AggressiveLanguageResult {
  count: number;
  instances: Array<{
    word: string;
    line: number;
    context: string;
  }>;
}

interface AnalysisResult {
  filePath: string;
  lineCount: number;
  characterCount: number;
  aggressiveLanguage: AggressiveLanguageResult;
  xmlTags: string[];
  sections: Array<{
    level: number;
    title: string;
    line: number;
  }>;
  hasBoundariesSection: boolean;
  hasAlwaysDoSection: boolean;
  hasAskFirstSection: boolean;
  hasAvoidSection: boolean;
  codeBlocks: number;
  tables: number;
  externalLinks: string[];
  whyContextCount: number;
  versionInfo: string | null;
  lastUpdated: string | null;
  scores: {
    lengthScore: number;
    xmlScore: number;
    aggressiveScore: number;
    boundariesBaseScore: number;
    codeBlockScore: number;
  };
}

// Patterns to detect
const AGGRESSIVE_WORDS = /\b(NEVER|CRITICAL|MANDATORY|MUST|ALWAYS)\b/g;
const XML_TAG_PATTERN = /<(\w+)>/g;
const MARKDOWN_HEADER = /^(#{1,6})\s+(.+)$/;
const CODE_BLOCK = /^```/;
const TABLE_ROW = /^\|.+\|$/;
const EXTERNAL_LINK = /\[.+?\]\(([^)]+)\)/g;
const WHY_CONTEXT_PATTERNS = [
  /—\s*.+$/,           // em-dash explanation
  /\(.+?\)$/,          // parenthetical at end
  /because\s/i,        // explicit "because"
  /since\s/i,          // explicit "since"
  /to\s+(ensure|prevent|enable|improve|reduce)/i,  // purpose phrases
];
const VERSION_PATTERN = /Version[:\s]+(\d+\.\d+\.\d+)/i;
const DATE_PATTERN = /Updated[:\s]+(\d{4}-\d{2}-\d{2})/i;

async function analyzeFile(filePath: string): Promise<AnalysisResult> {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  // Initialize result
  const result: AnalysisResult = {
    filePath: absolutePath,
    lineCount: 0,
    characterCount: 0,
    aggressiveLanguage: { count: 0, instances: [] },
    xmlTags: [],
    sections: [],
    hasBoundariesSection: false,
    hasAlwaysDoSection: false,
    hasAskFirstSection: false,
    hasAvoidSection: false,
    codeBlocks: 0,
    tables: 0,
    externalLinks: [],
    whyContextCount: 0,
    versionInfo: null,
    lastUpdated: null,
    scores: {
      lengthScore: 0,
      xmlScore: 0,
      aggressiveScore: 0,
      boundariesBaseScore: 0,
      codeBlockScore: 0,
    },
  };

  const fileStream = fs.createReadStream(absolutePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inCodeBlock = false;
  let tableRowCount = 0;
  let lineIndex = 0;

  // Pre-compile regexes for performance optimization
  const aggressiveRegex = new RegExp(AGGRESSIVE_WORDS.source, 'g');
  const xmlRegex = new RegExp(XML_TAG_PATTERN.source, 'g');
  const linkRegex = new RegExp(EXTERNAL_LINK.source, 'g');

  for await (const line of rl) {
    lineIndex++;
    const lineNum = lineIndex;

    // Update basic stats
    result.lineCount++;
    // readline strips the newline character(s), so we add 1 to approximate the original file length.
    result.characterCount += line.length + 1;

    // Track code blocks
    if (CODE_BLOCK.test(line)) {
      if (!inCodeBlock) {
        result.codeBlocks++;
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip analysis inside code blocks
    if (inCodeBlock) continue;

    // Check for aggressive language
    let match;

    aggressiveRegex.lastIndex = 0;
    while ((match = aggressiveRegex.exec(line)) !== null) {
      result.aggressiveLanguage.count++;
      result.aggressiveLanguage.instances.push({
        word: match[0],
        line: lineNum,
        context: line.trim().substring(0, 80),
      });
    }

    // Check for XML tags
    xmlRegex.lastIndex = 0;
    while ((match = xmlRegex.exec(line)) !== null) {
      if (!result.xmlTags.includes(match[1])) {
        result.xmlTags.push(match[1]);
      }
    }

    // Check for markdown headers
    const headerMatch = line.match(MARKDOWN_HEADER);
    if (headerMatch) {
      const title = headerMatch[2].trim();
      result.sections.push({
        level: headerMatch[1].length,
        title,
        line: lineNum,
      });

      // Check for boundaries-related sections
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('boundaries') || lowerTitle.includes('action boundaries')) {
        result.hasBoundariesSection = true;
      }
      if (lowerTitle.includes('always do') || lowerTitle.includes('✅')) {
        result.hasAlwaysDoSection = true;
      }
      if (lowerTitle.includes('ask first') || lowerTitle.includes('⚠️')) {
        result.hasAskFirstSection = true;
      }
      if (lowerTitle.includes('avoid') || lowerTitle.includes('never do') || lowerTitle.includes('❌')) {
        result.hasAvoidSection = true;
      }
    }

    // Count table rows
    if (TABLE_ROW.test(line)) {
      tableRowCount++;
    } else if (tableRowCount > 0) {
      if (tableRowCount >= 2) { // Header + at least one row
        result.tables++;
      }
      tableRowCount = 0;
    }

    // Check for external links
    linkRegex.lastIndex = 0;
    while ((match = linkRegex.exec(line)) !== null) {
      const link = match[1];
      if (!link.startsWith('#') && !result.externalLinks.includes(link)) {
        result.externalLinks.push(link);
      }
    }

    // Check for "Why" context patterns
    for (const pattern of WHY_CONTEXT_PATTERNS) {
      if (pattern.test(line)) {
        result.whyContextCount++;
        break; // Only count once per line
      }
    }

    // Check for version info
    if (!result.versionInfo) {
      const versionMatch = line.match(VERSION_PATTERN);
      if (versionMatch) {
        result.versionInfo = versionMatch[1];
      }
    }

    // Check for last updated date
    if (!result.lastUpdated) {
        const dateMatch = line.match(DATE_PATTERN);
        if (dateMatch) {
            result.lastUpdated = dateMatch[1];
        }
    }
  }

  // Handle any remaining table
  if (tableRowCount >= 2) {
    result.tables++;
  }

  // Calculate mechanical scores
  result.scores = calculateScores(result);

  return result;
}

function calculateScores(result: AnalysisResult): AnalysisResult['scores'] {
  // Length score (5 points)
  let lengthScore: number;
  if (result.lineCount < 250) lengthScore = 5;
  else if (result.lineCount < 300) lengthScore = 4;
  else if (result.lineCount < 400) lengthScore = 3;
  else if (result.lineCount < 500) lengthScore = 2;
  else lengthScore = 1;

  // XML tag score (5 points)
  let xmlScore: number;
  if (result.xmlTags.length >= 4) xmlScore = 5;
  else if (result.xmlTags.length >= 2) xmlScore = 3;
  else if (result.xmlTags.length >= 1) xmlScore = 2;
  else xmlScore = 0;

  // Aggressive language score (5 points)
  let aggressiveScore: number;
  const count = result.aggressiveLanguage.count;
  if (count === 0) aggressiveScore = 5;
  else if (count <= 3) aggressiveScore = 4;
  else if (count <= 7) aggressiveScore = 3;
  else if (count <= 12) aggressiveScore = 2;
  else aggressiveScore = 1;

  // Boundaries base score (7 points mechanical, 3 from AI judgment)
  let boundariesBaseScore = 0;
  if (result.hasBoundariesSection) boundariesBaseScore += 3;
  if (result.hasAlwaysDoSection) boundariesBaseScore += 2;
  if (result.hasAskFirstSection) boundariesBaseScore += 1;
  if (result.hasAvoidSection) boundariesBaseScore += 1;

  // Code block score (5 points)
  let codeBlockScore: number;
  if (result.codeBlocks >= 3) codeBlockScore = 5;
  else if (result.codeBlocks >= 1) codeBlockScore = 3;
  else codeBlockScore = 0;

  return {
    lengthScore,
    xmlScore,
    aggressiveScore,
    boundariesBaseScore,
    codeBlockScore,
  };
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: npx ts-node analyze.ts <path-to-claudemd>');
  console.error('Example: npx ts-node analyze.ts ./CLAUDE.md');
  process.exit(1);
}

(async () => {
    try {
      const result = await analyzeFile(args[0]);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
})();
