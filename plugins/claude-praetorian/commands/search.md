---
name: search
description: Search praetorian memory for past context
arguments: query
---

# /search

## Name

claude-praetorian:search - Search praetorian memory for past context

## Synopsis

/search

## Description

Performs a targeted search across all praetorian memory compactions using the provided query term. Returns matching compaction titles, types, and key insights.

Search for specific context in praetorian memory.

## Usage

- `/search auth` - Find auth-related compactions
- `/search "API design"` - Search for specific topic
- `/search decisions` - Find all decision records

## Action

Call `praetorian_restore(query)` with the search term and summarize:
- Matching compactions with titles and types
- Key insights from each match
- Relevant file references

## Examples

```
/search authentication
```
Returns compactions about auth implementation, JWT patterns, session management, etc.

```
/search file_reads
```
Returns all codebase exploration compactions.

## Implementation

See the usage and workflow sections above for implementation details.
