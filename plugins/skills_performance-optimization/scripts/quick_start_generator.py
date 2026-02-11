#!/usr/bin/env python3
"""Tool: Quick Start Generator.

Description: Automated quick-start generator for existing skills. Creates
lightweight variants focused on essential information with token optimization.

Usage: scripts/quick_start_generator.py [--skill-path PATH] [--output PATH]
[--token-target TARGET] [--show-stats].

Based on the conditional-loading performance optimization research plan.
Target: <300 tokens for Quick Start variants (70% reduction).
"""

import argparse
import logging
import re
import sys
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)

# Performance targets from research plan
DEFAULT_TOKEN_TARGET = 300
IDEAL_TOKEN_RANGE = (200, 300)
MAX_SECTIONS = 5
MAX_BULLETS_PER_SECTION = 4


class QuickStartGenerator:
    """Generates quick-start variants of skills with essential information only.

    Implements progressive loading strategy from conditional-loading research plan.
    Targets <300 tokens for Quick Start variants with 70% token reduction.
    """

    def __init__(self, skill_path: str, token_target: int = DEFAULT_TOKEN_TARGET) -> None:
        """Initialize quick start generator.

        Args:
            skill_path: Path to the skill file to process.
            token_target: Target token count for generated Quick Start (default: 300).

        """
        self.skill_path = Path(skill_path)
        self.skill_dir = self.skill_path.parent
        self.token_target = token_target
        self.skill_content = self._load_skill_content()
        self.frontmatter, self.content = self._parse_skill_content()
        self.generated_tokens = 0

    def _load_skill_content(self) -> list[str]:
        """Load skill content as lines."""
        try:
            with open(self.skill_path, encoding="utf-8") as f:
                return f.readlines()
        except FileNotFoundError as err:
            msg = f"Skill file not found: {self.skill_path}"
            raise FileNotFoundError(msg) from err

    def _parse_skill_content(self) -> tuple[dict, list[str]]:
        """Parse YAML frontmatter and content."""
        content_lines = self.skill_content

        if not content_lines or not content_lines[0].strip().startswith("---"):
            return {}, content_lines

        frontmatter_end = None
        for i, line in enumerate(content_lines[1:], 1):
            if line.strip() == "---":
                frontmatter_end = i
                break

        if frontmatter_end is None:
            return {}, content_lines

        try:
            frontmatter_text = "".join(content_lines[1:frontmatter_end])
            frontmatter = yaml.safe_load(frontmatter_text) or {}
            content = content_lines[frontmatter_end + 1 :]
            return frontmatter, content
        except yaml.YAMLError:
            return {}, content_lines

    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count for text.

        Uses rough approximation: 1 token ≈ 4 characters.

        Args:
            text: Text to estimate tokens for.

        Returns:
            Estimated token count.

        """
        return len(text) // 4

    def _is_within_budget(self, additional_text: str) -> bool:
        """Check if adding text would exceed token budget.

        Args:
            additional_text: Text to potentially add.

        Returns:
            True if within budget, False otherwise.

        """
        potential_tokens = self.generated_tokens + self._estimate_tokens(additional_text)
        return potential_tokens <= self.token_target

    def generate_quick_start(self) -> str:
        """Generate quick-start content focusing on essential information.

        Implements tiered content structure from research plan:
        - Frontmatter + Essential info (~100 tokens)
        - Quick Start section (~200 tokens)
        - Reference to full content

        Returns:
            Generated quick-start content as string.

        """
        quick_start_lines = []
        self.generated_tokens = 0

        # Add optimized frontmatter
        frontmatter_lines = self._generate_quick_start_frontmatter()
        quick_start_lines.extend(frontmatter_lines)
        self.generated_tokens += self._estimate_tokens("".join(frontmatter_lines))

        # Add title
        if self.content:
            quick_start_lines.append("\n")
            # Find first # heading
            for line in self.content:
                if line.strip().startswith("#"):
                    title = line.strip() + " (Quick Start)\n"
                    if self._is_within_budget(title):
                        quick_start_lines.append(title)
                        self.generated_tokens += self._estimate_tokens(title)
                    break

        # Add essential sections (priority-ordered)
        sections_to_add = [
            ("purpose", self._extract_purpose_section),
            ("when_to_use", self._extract_when_to_use),
            ("quick_usage", self._extract_quick_usage),
            ("essential_tools", self._extract_essential_tools),
        ]

        for section_name, extractor_func in sections_to_add:
            section_lines = extractor_func()
            section_text = "".join(section_lines)

            if self._is_within_budget(section_text):
                quick_start_lines.extend(section_lines)
                self.generated_tokens += self._estimate_tokens(section_text)
            else:
                logger.warning(
                    f"Skipping {section_name} section - would exceed token budget "
                    f"({self.generated_tokens + self._estimate_tokens(section_text)} "
                    f"> {self.token_target})"
                )
                break

        # Add loading marker for full content (as per research plan)
        marker_text = (
            "\n<!-- FULL_CONTENT_AVAILABLE -->\n"
            "<!-- Implementation details, examples, and workflows "
            "available in full SKILL.md -->\n"
        )
        quick_start_lines.append(marker_text)

        return "".join(quick_start_lines)

    def get_performance_metrics(self) -> dict[str, int | float]:
        """Get performance metrics for generated Quick Start.

        Returns:
            Dictionary with token counts and reduction percentage.

        """
        original_tokens = self._estimate_tokens("".join(self.skill_content))
        return {
            "original_tokens": original_tokens,
            "quick_start_tokens": self.generated_tokens,
            "tokens_saved": original_tokens - self.generated_tokens,
            "reduction_percentage": (
                (original_tokens - self.generated_tokens) / original_tokens * 100
                if original_tokens > 0
                else 0
            ),
            "target_met": self.generated_tokens <= self.token_target,
        }

    def _generate_quick_start_frontmatter(self) -> list[str]:
        """Generate optimized frontmatter for quick-start.

        Reduces estimated_tokens to match target and adds Quick Start designation.

        Returns:
            List of frontmatter lines.

        """
        quick_frontmatter = dict(self.frontmatter)

        # Optimize for quick usage (research plan: <300 tokens)
        quick_frontmatter.update(
            {
                "estimated_tokens": min(
                    quick_frontmatter.get("estimated_tokens", 800),
                    self.token_target,
                ),
                "complexity": quick_frontmatter.get("complexity", "basic"),
                "description": (
                    f"{quick_frontmatter.get('description', '')} (Quick Start variant)"
                ),
            },
        )

        # Preserve essential metadata
        if "tools" not in quick_frontmatter and self.frontmatter:
            quick_frontmatter["tools"] = self.frontmatter.get("tools", [])

        frontmatter_lines = ["---\n"]
        for key, value in quick_frontmatter.items():
            if isinstance(value, list):
                frontmatter_lines.append(f"{key}:\n")
                for item in value:
                    frontmatter_lines.append(f"  - {item}\n")
            else:
                frontmatter_lines.append(f"{key}: {value}\n")
        frontmatter_lines.append("---\n")

        return frontmatter_lines

    def _extract_purpose_section(self) -> list[str]:
        """Extract or create a concise purpose section."""
        purpose_lines = ["\n## Purpose\n"]

        # Look for existing purpose/overview section
        content_text = "".join(self.content)

        # Try to find existing purpose/overview
        purpose_patterns = [
            r"##\s*(?:Purpose|Overview|What.*Is)\s*\n(.*?)(?=\n##|\n\n)",
            r"###?\s*(?:Purpose|Overview)\s*\n(.*?)(?=\n#|\n\n)",
        ]

        for pattern in purpose_patterns:
            match = re.search(pattern, content_text, re.DOTALL | re.IGNORECASE)
            if match:
                purpose_text = match.group(1).strip()
                # Shorten to 1-2 sentences
                sentences = re.split(r"[.!?]+", purpose_text)
                if sentences:
                    short_purpose = ". ".join(sentences[:2]).strip()
                    if short_purpose and not short_purpose.endswith("."):
                        short_purpose += "."
                    purpose_lines.append(f"{short_purpose}\n")
                    return purpose_lines

        # Generate default purpose from description
        if self.frontmatter and "description" in self.frontmatter:
            description = self.frontmatter["description"]
            # Extract first sentence
            first_sentence = re.split(r"[.!?]+", description)[0]
            purpose_lines.append(f"{first_sentence}.\n")
        else:
            purpose_lines.append(
                "Essential skill functionality for specific use cases.\n",
            )

        return purpose_lines

    def _extract_when_to_use(self) -> list[str]:
        """Extract concise when to use section.

        Limits to MAX_BULLETS_PER_SECTION bullets for token efficiency.

        Returns:
            List of when-to-use section lines.

        """
        when_to_use_lines = ["\n## When to Use\n"]

        content_text = "".join(self.content)

        # Look for existing when to use section
        when_patterns = [
            r"##\s*(?:When to Use|Use Cases|Perfect for)\s*\n(.*?)(?=\n##|\n\n)",
            r"###?\s*(?:When to Use|Use Cases)\s*\n(.*?)(?=\n#|\n\n)",
        ]

        for pattern in when_patterns:
            match = re.search(pattern, content_text, re.DOTALL | re.IGNORECASE)
            if match:
                use_text = match.group(1).strip()
                # Extract bullet points or create them
                bullets = re.findall(r"[•\-*]\s*(.*?)(?=\n|$)", use_text)
                if bullets:
                    # Limit to MAX_BULLETS_PER_SECTION for token efficiency
                    for bullet in bullets[:MAX_BULLETS_PER_SECTION]:
                        cleaned_bullet = re.sub(r"\s+", " ", bullet.strip())
                        if cleaned_bullet:
                            when_to_use_lines.append(f"• {cleaned_bullet}\n")
                    return when_to_use_lines

        # Generate minimal generic when to use
        when_to_use_lines.append("• Use for common scenarios\n")
        when_to_use_lines.append("• Not for alternative approaches\n")

        return when_to_use_lines

    def _extract_quick_usage(self) -> list[str]:
        """Extract quick usage examples.

        Limits to 2 examples for token efficiency.

        Returns:
            List of quick usage section lines.

        """
        usage_lines = ["\n## Quick Usage\n"]

        content_text = "".join(self.content)

        # Look for existing quick start or usage sections
        usage_patterns = [
            r"##\s*(?:Quick Start|Usage|Quick Usage|Getting Started)\s*\n"
            r"(.*?)(?=\n##|\n\n)",
            r"```(?:bash|python|shell)\s*\n(.*?)```",
        ]

        examples_found = 0
        for pattern in usage_patterns:
            matches = re.findall(pattern, content_text, re.DOTALL | re.IGNORECASE)
            if matches and examples_found == 0:
                # Limit to 2 examples for token efficiency
                for match in matches[:2]:
                    usage_text = match.strip()
                    if usage_text and len(usage_text) < 200:  # Keep examples concise
                        usage_lines.append(f"```bash\n{usage_text}\n```\n")
                        examples_found += 1
                if examples_found > 0:
                    return usage_lines

        # Check for tools in frontmatter as fallback
        if self.frontmatter and "tools" in self.frontmatter:
            tools = self.frontmatter["tools"]
            if isinstance(tools, list) and tools:
                usage_lines.append("```bash\n")
                # Show first 2 tools only
                for tool in tools[:2]:
                    if isinstance(tool, str):
                        usage_lines.append(f"# {tool}\n")
                usage_lines.append("```\n")

        return usage_lines

    def _extract_essential_tools(self) -> list[str]:
        """Extract essential tools information.

        Limits to MAX_BULLETS_PER_SECTION tools for token efficiency.

        Returns:
            List of essential tools section lines.

        """
        tools_lines = ["\n## Essential Tools\n"]

        if self.frontmatter and "tools" in self.frontmatter:
            tools = self.frontmatter["tools"]
            if isinstance(tools, list) and tools:
                # Limit to MAX_BULLETS_PER_SECTION for token efficiency
                for tool in tools[:MAX_BULLETS_PER_SECTION]:
                    if isinstance(tool, str):
                        tool_desc = self._get_tool_description(tool)
                        tools_lines.append(f"- `{tool}`: {tool_desc}\n")
                    elif isinstance(tool, dict) and "name" in tool:
                        name = tool["name"]
                        desc = tool.get("description", "Essential functionality")
                        tools_lines.append(f"- `{name}`: {desc}\n")
        else:
            tools_lines.append("- Essential tools for skill functionality\n")

        return tools_lines

    def _get_tool_description(self, tool_name: str) -> str:
        """Get description for a tool name."""
        # Look for tool descriptions in content
        content_text = "".join(self.content)

        tool_pattern = (
            rf"(?:{re.escape(tool_name)}.*?)(?:-|:)\s*([^.!?\n]*[.!?]?)(?=\n|$)"
        )
        match = re.search(tool_pattern, content_text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

        # Generate generic descriptions
        generic_descriptions = {
            "skill-analyzer": "Complexity analysis and recommendations",
            "token-estimator": "Usage forecasting and optimization",
            "module_validator": "Structure validation and compliance",
            "skills-auditor": "detailed skill discovery and analysis",
            "improvement-suggester": "Prioritized improvement recommendations",
            "compliance-checker": "Standards validation and security checking",
        }

        return generic_descriptions.get(tool_name, "Essential tool functionality")

    def save_quick_start(self, output_path: str | None = None) -> str:
        """Save quick-start variant.

        Args:
            output_path: Optional custom output path. Defaults to QUICK_START.md.

        Returns:
            Path where Quick Start was saved.

        """
        if output_path is None:
            output_path = self.skill_dir / "QUICK_START.md"

        quick_start_content = self.generate_quick_start()

        try:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(quick_start_content)
        except OSError as err:
            msg = f"Failed to save quick start to {output_path}"
            raise OSError(msg) from err

        return str(output_path)


def _process_batch_directory(batch_path: str, show_stats: bool, token_target: int) -> None:
    """Process all SKILL.md files in a directory.

    Args:
        batch_path: Directory containing SKILL.md files.
        show_stats: Whether to show performance statistics.
        token_target: Target token count for Quick Starts.

    """
    batch_dir = Path(batch_path)
    if not batch_dir.exists():
        msg = f"Directory not found: {batch_path}"
        raise FileNotFoundError(msg)

    skill_files = list(batch_dir.glob("**/SKILL.md"))
    if not skill_files:
        logger.warning(f"No SKILL.md files found in {batch_path}")
        sys.exit(1)

    generated_count = 0
    total_tokens_saved = 0
    total_reduction = 0.0

    for skill_file in skill_files:
        try:
            generator = QuickStartGenerator(str(skill_file), token_target)
            output_path = generator.save_quick_start()
            generated_count += 1

            # Get performance metrics
            metrics = generator.get_performance_metrics()
            total_tokens_saved += metrics["tokens_saved"]
            total_reduction += metrics["reduction_percentage"]

            if show_stats:
                logger.info(
                    f"Generated {output_path}:\n"
                    f"  Original: {metrics['original_tokens']} tokens\n"
                    f"  Quick Start: {metrics['quick_start_tokens']} tokens\n"
                    f"  Saved: {metrics['tokens_saved']} tokens "
                    f"({metrics['reduction_percentage']:.1f}% reduction)\n"
                    f"  Target met: {metrics['target_met']}"
                )

        except Exception as e:
            logger.error(f"Failed to process {skill_file}: {e}")

    if show_stats and generated_count > 0:
        avg_tokens_saved = total_tokens_saved // generated_count
        avg_reduction = total_reduction / generated_count
        logger.info(
            f"\nBatch summary:\n"
            f"  Files processed: {generated_count}\n"
            f"  Average tokens saved: {avg_tokens_saved}\n"
            f"  Average reduction: {avg_reduction:.1f}%"
        )


def _process_single_skill(
    skill_path: str,
    output_path: str | None,
    show_stats: bool,
    token_target: int,
) -> None:
    """Process a single skill file.

    Args:
        skill_path: Path to SKILL.md file.
        output_path: Optional output path for Quick Start.
        show_stats: Whether to show performance statistics.
        token_target: Target token count for Quick Start.

    """
    generator = QuickStartGenerator(skill_path, token_target)
    output = generator.save_quick_start(output_path)

    if show_stats:
        metrics = generator.get_performance_metrics()
        logger.info(
            f"Quick Start generated: {output}\n"
            f"Original tokens: {metrics['original_tokens']}\n"
            f"Quick Start tokens: {metrics['quick_start_tokens']}\n"
            f"Tokens saved: {metrics['tokens_saved']} "
            f"({metrics['reduction_percentage']:.1f}% reduction)\n"
            f"Target ({token_target} tokens) met: {metrics['target_met']}"
        )


def main() -> None:
    """Generate quick-start variants of skills.

    Implements progressive loading strategy from conditional-loading research plan.
    """
    parser = argparse.ArgumentParser(
        description="Generate quick-start variants of skills with token optimization",
    )
    parser.add_argument("skill_path", help="Path to skill file or directory")
    parser.add_argument("--output", help="Output path for quick-start variant")
    parser.add_argument("--batch", action="store_true", help="Process all skills in directory")
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Show generation statistics and performance metrics",
    )
    parser.add_argument(
        "--token-target",
        type=int,
        default=DEFAULT_TOKEN_TARGET,
        help=f"Target token count for Quick Start (default: {DEFAULT_TOKEN_TARGET})",
    )

    args = parser.parse_args()

    # Configure logging
    logging.basicConfig(
        level=logging.INFO if args.stats else logging.WARNING,
        format="%(message)s",
    )

    try:
        if args.batch:
            _process_batch_directory(args.skill_path, args.stats, args.token_target)
        else:
            _process_single_skill(
                args.skill_path,
                args.output,
                args.stats,
                args.token_target,
            )

    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
