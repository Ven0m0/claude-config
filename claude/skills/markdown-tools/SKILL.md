---
name: markdown-tools
description: Document conversion and Mermaid diagram extraction. Converts PDF, PPTX, and DOCX to Markdown. Triggers: convert-doc, markdown, mermaid-extract.
allowed-tools: Bash, Read
---

# Markdown and Document Tools

Utility for converting various document formats to Markdown and extracting diagrams.

## Document Conversion

Use `markitdown` or similar tools (if available) to convert documents.

```bash
# Example conversion workflow
markitdown input.pdf -o output.md
```

## Mermaid Extraction

Extract Mermaid diagrams from Markdown files and generate high-quality PNGs using `mermaid-cli`.

```bash
# Extract and generate
mmdc -i input.md -o diagram.png
```

## Best Practices

1. **Path Handling**: Always use absolute paths when dealing with conversion tools to avoid ambiguity.
2. **Image Extraction**: Ensure images are saved in an `assets/` directory relative to the Markdown file.
3. **Typography**: Use standard Markdown syntax for tables and lists to ensure compatibility across viewers.
