export type Issue = {
  id: string;
  title: string;
  notes: string;
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
        typeof item.id !== 'string' ||
        !item.id ||
        typeof item.title !== 'string' ||
        !item.title.trim() ||
        item.title.length > 100 ||
        typeof item.notes !== 'string' ||
        item.notes.length > 1000 ||
        (item.priority !== undefined && !['Low', 'Normal', 'High'].includes(item.priority)) ||
        !['Open', 'In progress', 'Done'].includes(item.status)
    ) ||
    new Set(data.map((item) => item.id)).size !== data.length
  ) {
    throw new Error('Invalid saved issues');
  }
  return data.map(item => ({ ...item, priority: item.priority ?? 'Normal' }));
}

export function loadIssues(): { issues: Issue[]; error: string } {
  try {
    return { issues: parseIssues(localStorage.getItem(storageKey)), error: '' };
  } catch {
    return {
      issues: [],
      error:
        'Saved issues could not be read. Reload after checking browser storage. Changes are disabled to protect existing data.',
    };
  }
}
