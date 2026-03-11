export function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== 'string')) {
    throw new Error('Tags must be a list of names.');
  }
  const tags = value.map((tag: string) => tag.trim().toLowerCase()).filter(Boolean);
  const unique = [...new Set(tags)];
  if (unique.length > 5 || unique.some((tag) => tag.length > 24 || /[,\r\n]/.test(tag))) {
    throw new Error('Use up to five tags, each at most 24 characters without commas or line breaks.');
  }
  return unique;
}

import { Issue } from './storage';
export function tagSelected(issues: Issue[], ids: string[], tag: string, remove = false): Issue[] {
  const [name] = normalizeTags([tag]);
  if (!name) throw new Error('Enter a tag name.');
  return issues.map((issue) => {
    if (!ids.includes(issue.id)) return issue;
    const before = issue.tags ?? [];
    const tags = remove ? before.filter((value) => value !== name) : normalizeTags([...before, name]);
    if (JSON.stringify(tags) === JSON.stringify(before)) return issue;
    return { ...issue, tags, updatedAt: new Date().toISOString() };
  });
}
