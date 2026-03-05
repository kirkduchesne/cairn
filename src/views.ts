import { Query } from './query';
export type SavedView = { id: string; name: string; query: Query };
export const viewsKey = 'issue-desk-views-v1';
export function parseViews(raw: string | null): SavedView[] {
  if (raw === null) return [];
  const data = JSON.parse(raw);
  if (
    !Array.isArray(data) ||
    data.length > 12 ||
    data.some(
      (view) =>
        !view ||
        typeof view.id !== 'string' ||
        !view.id ||
        view.id.length > 100 ||
        typeof view.name !== 'string' ||
        !view.name.trim() ||
        view.name.length > 40 ||
        !view.query ||
        (view.query.tag !== undefined && (typeof view.query.tag !== 'string' || view.query.tag.length > 24)) ||
        typeof view.query.text !== 'string' ||
        view.query.text.length > 200 ||
        !['All', 'Open', 'In progress', 'Done'].includes(view.query.status) ||
        !['All', 'Low', 'Normal', 'High'].includes(view.query.priority) ||
        !['Added', 'Priority', 'Title'].includes(view.query.order),
    ) ||
    new Set(data.map((view) => view.id)).size !== data.length ||
    new Set(data.map((view) => view.name.trim().toLowerCase())).size !==
      data.length
  ) {
    throw new Error('Invalid saved views');
  }
  return data;
}

export function loadViews(): {
  views: SavedView[];
  raw: string | null;
  error: string;
} {
  try {
    const raw = localStorage.getItem(viewsKey);
    return { views: parseViews(raw), raw, error: '' };
  } catch {
    return {
      views: [],
      raw: null,
      error:
        'Saved views cannot be read. Existing data is preserved; reload after checking browser storage.',
    };
  }
}
export function persistViews(
  views: SavedView[],
  expected: string | null,
): string {
  const raw = JSON.stringify(views);
  parseViews(raw);
  if (localStorage.getItem(viewsKey) !== expected)
    throw new Error(
      'Views changed in another tab. Reload before saving views.',
    );
  localStorage.setItem(viewsKey, raw);
  return raw;
}
