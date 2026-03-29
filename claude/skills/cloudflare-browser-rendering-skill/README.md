# Cloudflare Browser Rendering Skill

An OpenClaw skill for extracting rendered webpage content with Cloudflare Browser Rendering APIs.

It fills the gap between lightweight `web_fetch` and full interactive browser automation:
- Use `/markdown` for JavaScript-heavy single pages
- Use `/crawl` for asynchronous multi-page site/documentation crawling
- Fall back to `browser` when login or interaction is required

## Why this skill exists

OpenClaw already has strong tools for two ends of the spectrum:
- `web_fetch` is fast and lightweight for simple pages
- `browser` is powerful for interactive workflows

This skill sits in the middle:
- stronger than `web_fetch` when rendering matters
- lighter than `browser` when you only need content extraction

## What is included

- `SKILL.md` — OpenClaw routing and usage guidance
- `scripts/cf_markdown.py` — rendered single-page Markdown extraction
- `scripts/cf_crawl.py` — async crawl job helper with polling, result fetch, and markdown export
- `references/` — endpoint notes and decision rules

## Use cases

- Extract clean Markdown from JS-rendered docs or articles
- Crawl documentation sites or knowledge bases
- Prepare content for summarization, search, or RAG ingestion
- Bridge the gap between simple fetch and full browser automation

## Requirements

Set these environment variables before running the scripts:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Your token needs Cloudflare Browser Rendering permissions.

## Quick examples

### Single page -> Markdown

```bash
python3 scripts/cf_markdown.py \
  --url https://developers.cloudflare.com/workers/ \
  --wait-until networkidle0 \
  --timeout-ms 60000
```

### Crawl a docs site

```bash
python3 scripts/cf_crawl.py run \
  --url https://developers.cloudflare.com/workers/ \
  --limit 20 \
  --depth 2 \
  --format markdown \
  --wait \
  --fetch-results \
  --results-status completed \
  --out-json out/crawl.json \
  --out-markdown out/crawl.md
```

## Tool selection rule

- Use `web_fetch` first for simple static pages
- Use this skill when rendering matters or when you need multi-page crawling
- Use `browser` for login, clicks, forms, and interactive flows

## Limitations

- Very heavy pages may time out when waiting for full network idle
- In those cases, increase timeout first, then consider `domcontentloaded`, or switch to a targeted browser workflow
- This repository contains the skill source only; publishing to ClawHub is a separate step

## Repository structure

```text
.
├── SKILL.md
├── README.md
├── LICENSE
├── scripts/
│   ├── cf_markdown.py
│   └── cf_crawl.py
└── references/
    ├── decision-guide.md
    ├── markdown-endpoint.md
    └── crawl-endpoint.md
```

## License

MIT-0
