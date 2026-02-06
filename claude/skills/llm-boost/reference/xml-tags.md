# XML Tag Patterns Reference

Comprehensive reference for designing XML tag structures in LLM prompts.

Source: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags

## Why XML Tags

XML tags give LLMs structural cues that improve accuracy, reduce mixing of prompt components, and enable parseable output. There are no canonical "best" tags — name them semantically for your use case.

## Design Principles

1. **Semantic naming**: `<contract>` not `<data1>`, `<rubric>` not `<section_a>`
2. **Consistency**: Use same tag names throughout; reference them explicitly ("Using the contract in `<contract>` tags...")
3. **Nesting**: `<outer><inner></inner></outer>` for hierarchical content
4. **Attributes for collections**: `<document index="1">`, `<example id="auth">`
5. **Combine with techniques**: Pair with CoT, multishot, role prompts

## Tag Catalog

### Input Structuring Tags

| Tag | Purpose | Example Use |
|-----|---------|-------------|
| `<context>` | Background information | Project description, domain knowledge |
| `<instructions>` | What to do | Task directives, constraints |
| `<document>` | Source material | Files, articles, contracts |
| `<data>` / `<dataset>` | Structured input | CSV, JSON, records |
| `<examples>` | Few-shot demonstrations | Input/output pairs |
| `<rules>` | Constraints and conditions | Business logic, validation rules |
| `<schema>` | Structure definitions | API schemas, data models |
| `<persona>` / `<role>` | Identity framing | Expert role, tone guidance |

### Output Structuring Tags

| Tag | Purpose | Extraction Pattern |
|-----|---------|-------------------|
| `<thinking>` | Internal reasoning (CoT) | Filter out before showing user |
| `<answer>` | Final response | Primary extraction target |
| `<score>` | Numeric evaluation | `int(extract_tag(text, 'score'))` |
| `<feedback>` | Qualitative assessment | Display to user |
| `<classification>` | Category assignment | Route to handler |
| `<confidence>` | Certainty level | Threshold decisions |
| `<action>` | Recommended next step | Workflow routing |
| `<citation>` | Source attribution | Reference linking |

### Organizational Tags

| Tag | Purpose |
|-----|---------|
| `<section>` | Logical grouping |
| `<formatting>` | Output format specification |
| `<constraints>` | What to avoid or limit |
| `<task>` | Specific work item |
| `<metadata>` | Non-content information |

## Patterns

### Pattern 1: Multi-Document Analysis

```xml
<documents>
  <document index="1">
    <source>contract_v2.pdf</source>
    <content>Full text of the contract...</content>
  </document>
  <document index="2">
    <source>amendment_1.pdf</source>
    <content>Amendment text...</content>
  </document>
</documents>

<instructions>
  Analyze the documents above for conflicts between the original
  contract and the amendment. Reference documents by index.
</instructions>
```

### Pattern 2: Structured Evaluation

```xml
<rubric>
  <criterion name="clarity" weight="30">
    Clear, unambiguous language throughout
  </criterion>
  <criterion name="completeness" weight="40">
    All required sections present with sufficient detail
  </criterion>
  <criterion name="accuracy" weight="30">
    All claims verifiable and correct
  </criterion>
</rubric>

<submission>
  Content to evaluate...
</submission>

<instructions>
  Evaluate the submission against each criterion in the rubric.
  Output your evaluation in this format:
  <evaluation>
    <criterion name="..."><score>0-100</score><feedback>...</feedback></criterion>
    <overall_score>weighted average</overall_score>
    <summary>Key strengths and improvements</summary>
  </evaluation>
</instructions>
```

### Pattern 3: CoT Separation

```xml
<instructions>
  Solve the problem step by step.
  Put your reasoning in <thinking> tags.
  Put only your final answer in <answer> tags.
</instructions>

<problem>
  If a train travels at 60mph for 2.5 hours, then 80mph for 1.5 hours,
  what is the total distance?
</problem>
```

Output:
```xml
<thinking>
Distance = speed × time
Segment 1: 60 × 2.5 = 150 miles
Segment 2: 80 × 1.5 = 120 miles
Total: 150 + 120 = 270 miles
</thinking>
<answer>270 miles</answer>
```

### Pattern 4: Multishot with Tags

```xml
<examples>
  <example>
    <input>The product is amazing and works perfectly!</input>
    <classification>positive</classification>
    <confidence>0.95</confidence>
  </example>
  <example>
    <input>Terrible quality, broke after one day.</input>
    <classification>negative</classification>
    <confidence>0.98</confidence>
  </example>
  <example>
    <input>It's okay, nothing special but does the job.</input>
    <classification>neutral</classification>
    <confidence>0.72</confidence>
  </example>
</examples>

<instructions>
  Classify the following review using the same format as the examples above.
</instructions>

<input>Pretty good value for the price, though shipping was slow.</input>
```

### Pattern 5: Conditional Workflow

```xml
<context>
  You are a customer support router for a software company.
</context>

<rules>
  <rule priority="1">If the message mentions billing, payment, or refund → route to billing team</rule>
  <rule priority="2">If the message mentions a bug, error, or crash → route to engineering</rule>
  <rule priority="3">If the message asks how to use a feature → route to documentation</rule>
  <rule priority="4">All other messages → route to general support</rule>
</rules>

<instructions>
  Analyze the customer message and output:
  <routing>
    <team>team name</team>
    <priority>1-4</priority>
    <summary>One-line summary for the receiving team</summary>
  </routing>
</instructions>

<message>
  I've been charged twice for my subscription this month.
</message>
```

### Pattern 6: Guard Rails

```xml
<persona>
  You are a technical documentation writer.
</persona>

<instructions>
  <task>Write API documentation for the endpoint described below.</task>
  <formatting>
    Use markdown with H2 for sections.
    Include: Description, Parameters, Request Example, Response Example, Error Codes.
  </formatting>
  <constraints>
    Do not include implementation details.
    Do not suggest alternative approaches.
    Keep examples minimal and self-contained.
  </constraints>
</instructions>

<endpoint>
  POST /api/v2/users
  Creates a new user account.
  Body: { name: string, email: string, role?: "admin" | "user" }
  Returns: 201 with user object, 400 on validation error, 409 on duplicate email
</endpoint>
```

## Post-Processing Recipes

### Python Extraction

```python
import re
from typing import Optional

def extract_tag(text: str, tag: str) -> Optional[str]:
    """Extract content of first matching tag."""
    match = re.search(f'<{tag}>(.*?)</{tag}>', text, re.DOTALL)
    return match.group(1).strip() if match else None

def extract_all(text: str, tag: str) -> list[str]:
    """Extract all instances of a tag."""
    return [m.strip() for m in re.findall(f'<{tag}>(.*?)</{tag}>', text, re.DOTALL)]

def extract_indexed(text: str, tag: str) -> dict[int, str]:
    """Extract indexed tags: <tag index="N">content</tag>"""
    pattern = f'<{tag} index="(\\d+)">(.*?)</{tag}>'
    return {int(i): c.strip() for i, c in re.findall(pattern, text, re.DOTALL)}

def extract_named(text: str, tag: str) -> dict[str, str]:
    """Extract named tags: <tag name="key">content</tag>"""
    pattern = f'<{tag} name="([^"]+)">(.*?)</{tag}>'
    return {n: c.strip() for n, c in re.findall(pattern, text, re.DOTALL)}

def strip_thinking(text: str) -> str:
    """Remove thinking tags, keep answer."""
    return re.sub(r'<thinking>.*?</thinking>', '', text, flags=re.DOTALL).strip()
```

### JavaScript Extraction

```javascript
function extractTag(text, tag) {
  const match = text.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 's'));
  return match ? match[1].trim() : null;
}

function extractAll(text, tag) {
  return [...text.matchAll(new RegExp(`<${tag}>(.*?)</${tag}>`, 'gs'))]
    .map(m => m[1].trim());
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Generic names (`<data1>`, `<section_a>`) | Use semantic names (`<contract>`, `<rubric>`) |
| Inconsistent naming (mix `<doc>` and `<document>`) | Pick one, use everywhere |
| Not referencing tags in instructions | "Using the data in `<dataset>` tags..." |
| Over-nesting (5+ levels deep) | Flatten to 2-3 levels max |
| Tags in output without extraction plan | Define extraction before prompting |
| Missing closing tags | Always close: `<tag>...</tag>` |
| Using XML reserved chars unescaped in content | Escape `&`, `<`, `>` in data or use CDATA |

## Tag Design Checklist

- [ ] Each tag name describes its content semantically
- [ ] Same tag names used consistently throughout prompt
- [ ] Instructions reference tags by name explicitly
- [ ] Nesting hierarchy is logical and ≤3 levels
- [ ] Collections use index/id attributes
- [ ] Output tags defined for easy extraction
- [ ] Post-processing code written for output tags
- [ ] Tag boundaries tested to prevent content leaking
