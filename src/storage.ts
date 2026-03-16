import { normalizeTags } from './tags';
export type Issue = {
  id: string;
  tags?: string[];
  archived?: boolean;
  title: string;
  notes: string;
  updatedAt: string | null;
  priority: 'Low' | 'Normal' | 'High';
  status: 'Open' | 'In progress' | 'Done';
};
export const storageKey = 'issue-desk-v1';

export function parseIssues(raw: string | null): Issue[] {
  if (raw === null) return [];
  const data: unknown = JSON.parse(raw);
  if (
    !Array.isArray(data) ||
    data.some(
      (item) =>
        !item ||
        (item.archived !== undefined && typeof item.archived !== 'boolean') ||
        (item.archived === true && item.status !== 'Done') ||
        typeof item.id !== 'string' ||
        !item.id ||
        typeof item.title !== 'string' ||
        !item.title.trim() ||
        item.title.length > 100 ||
        typeof item.notes !== 'string' ||
        item.notes.length > 1000 ||
        (item.updatedAt !== undefined &&
          item.updatedAt !== null &&
          (typeof item.updatedAt !== 'string' ||
            !Number.isFinite(Date.parse(item.updatedAt)))) ||
        (item.priority !== undefined &&
          !['Low', 'Normal', 'High'].includes(item.priority)) ||
        !['Open', 'In progress', 'Done'].includes(item.status),
    ) ||
    new Set(data.map((item) => item.id)).size !== data.length
  ) {
    throw new Error('Invalid saved issues');
  }
  return data.map((item) => ({
    ...item,
    ...(item.tags === undefined ? {} : { tags: normalizeTags(item.tags) }),
    priority: item.priority ?? 'Normal',
    updatedAt: item.updatedAt ?? null,
  }));
}

export function loadIssues(): {
  issues: Issue[];
  error: string;
  raw: string | null;
} {
  try {
    const raw = localStorage.getItem(storageKey);
    return { issues: parseIssues(raw), error: '', raw };
  } catch {
    return {
      issues: [],
      raw: null,
      error:
        'Saved issues could not be read. Reload after checking browser storage. Changes are disabled to protect existing data.',
    };
  }
}
