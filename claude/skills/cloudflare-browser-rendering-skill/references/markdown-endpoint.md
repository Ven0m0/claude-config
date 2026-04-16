# /markdown endpoint notes

## Purpose

Convert one rendered webpage into Markdown.

## Endpoint

`POST /accounts/{account_id}/browser-rendering/markdown`

## From the docs

- Requires either `url` or `html`
- Supports render/load controls such as `gotoOptions` and wait-for behavior
- Docs also mention advanced options including auth, cookies, custom user agent, and request filtering
- Query parameter includes `cacheTTL` (default 5s; set 0 to disable cache)

## Good defaults

- For normal pages: use default wait behavior
- For SPA pages: use `gotoOptions.waitUntil=networkidle0`
- For slow/heavy pages: raise timeout first; if still timing out, try `domcontentloaded` or switch to a targeted browser workflow
- For freshness-sensitive pages: `cacheTTL=0`

## Best use cases

- Rendered article extraction
- JS-heavy docs page capture
- Normalize page content before summarization or storage

## Not ideal for

- Whole-site ingestion
- Interactive workflows
- Extremely heavy pages where waiting for full network idle repeatedly times out
