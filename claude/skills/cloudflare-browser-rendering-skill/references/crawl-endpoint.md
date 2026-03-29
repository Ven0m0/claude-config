# /crawl endpoint notes

## Purpose
Start an asynchronous crawl job from a seed URL and later retrieve results.

## Main endpoints
- `POST /accounts/{account_id}/browser-rendering/crawl`
- `GET /accounts/{account_id}/browser-rendering/crawl/{job_id}`
- `DELETE /accounts/{account_id}/browser-rendering/crawl/{job_id}`

## Create-job behavior
- Returns a crawl `job_id`
- Intended for multi-page crawling across a site
- Useful knobs from docs include depth, page limit, formats, render behavior, and link-scope options

## Get-results behavior
Supports lightweight polling and paginated result retrieval.
Important query params documented on the method page:
- `cacheTTL`
- `cursor`
- `limit`
- `status` filter

Status filter values include:
- `queued`
- `errored`
- `completed`
- `disallowed`
- `skipped`
- `cancelled`

## Good operating pattern
1. Start crawl
2. Poll lightly with a small `limit`
3. Once complete, fetch filtered `completed` records
4. Summarize before sharing

## Use cases
- Crawl a docs site section
- Collect knowledge-base pages for embeddings/RAG
- Monitor content across multiple related pages
