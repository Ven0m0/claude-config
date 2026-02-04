import { safeIdentifier } from "./util.mjs";

/** @param {string} s */
function tokenize(s) {
  return (s || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

/**
 * Very lightweight ranking for tool search.
 * @param {{name?:string,title?:string,description?:string}} tool
 * @param {string[]} qTokens
 * @param {string} qRaw
 */
function score(tool, qTokens, qRaw) {
  const name = (tool?.name || "").toLowerCase();
  const title = (tool?.title || "").toLowerCase();
  const desc = (tool?.description || "").toLowerCase();

  let s = 0;

  if (qRaw && name.includes(qRaw)) s += 10;
  if (qRaw && title.includes(qRaw)) s += 5;
  if (qRaw && desc.includes(qRaw)) s += 3;

  for (const tok of qTokens) {
    if (name.includes(tok)) s += 4;
    if (title.includes(tok)) s += 2;
    if (desc.includes(tok)) s += 1;
  }

  // Prefer shorter tool names (minor)
  s += Math.max(0, 2 - name.length / 30);

  return s;
}

/**
 * Search tools.
 * @param {any[]} tools
 * @param {string} query
 * @param {{ limit?: number }} opts
 */
export function searchTools(tools, query, opts = {}) {
  const limit = typeof opts.limit === "number" ? opts.limit : 8;
  const qRaw = (query || "").trim().toLowerCase();
  const qTokens = tokenize(query);

  const ranked = (tools || [])
    .map((t) => ({
      tool: t,
      score: score(t, qTokens, qRaw),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map((r) => ({
    name: r.tool?.name || "",
    title: r.tool?.title || "",
    description: (r.tool?.description || "").replace(/\s+/g, " ").trim(),
    score: r.score,
    safeName: safeIdentifier(r.tool?.name || ""),
  }));
}
