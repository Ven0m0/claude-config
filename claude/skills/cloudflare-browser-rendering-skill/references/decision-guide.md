# Decision Guide

## Choose the right tool

### Use `web_fetch`
- Static pages
- Quick one-page reads
- Cheapest and simplest path

### Use Cloudflare `/markdown`
- Page content is incomplete in `web_fetch`
- The site renders content via JavaScript
- You want normalized Markdown for a single page
- You need render-aware options like `gotoOptions.waitUntil`

### Use Cloudflare `/crawl`
- You need many related pages from one site
- You are building a docs digest, research corpus, or RAG input set
- You want asynchronous crawling with pagination and result filters

### Use `browser`
- Login is required
- You must click buttons, fill forms, or navigate interactive UI
- Human-like inspection/automation is necessary

## Escalation sequence

1. Try `web_fetch`
2. If incomplete/empty because of rendering, use `/markdown`
3. If multiple pages are needed, use `/crawl`
4. If interaction is required, switch to `browser`

## Cost and scope control

- Start small on `/crawl`: low depth, low limit
- Avoid `includeExternalLinks` unless explicitly needed
- Prefer markdown output unless JSON extraction is the goal
- Do not paste massive crawl outputs into chat; summarize first
