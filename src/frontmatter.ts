/**
 * Obsidian's frontmatter cache is typed as effectively `any`. Casting
 * directly from `any` to a specific type (e.g. `x as Record<string,
 * unknown>`) is flagged by strict linting as an "unnecessary assertion",
 * since `any` already accepts anything. Routing through a function whose
 * parameter is declared `unknown` forces a real (and lint-clean) narrowing
 * step instead.
 */
export function toFrontmatterRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null) return undefined;
  return value as Record<string, unknown>;
}
