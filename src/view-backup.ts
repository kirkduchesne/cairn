import { SavedView, parseViews, suffixViewName } from './views';
export const viewBackupLimit = 100_000;
export function parseViewBackup(raw: string): SavedView[] {
  if (raw.length > viewBackupLimit)
    throw new Error('View backup exceeds 100,000 characters.');
  const data = JSON.parse(raw);
  if (!data || data.kind !== 'issue-desk-views' || data.version !== 1)
    throw new Error('Choose a Cairn views backup.');
  return parseViews(JSON.stringify(data.views));
}
export function serializeViews(views: SavedView[]): string {
  const raw = JSON.stringify(
    { kind: 'issue-desk-views', version: 1, views },
    null,
    2,
  );
  parseViewBackup(raw);
  return raw;
}
export function downloadViews(views: SavedView[]) {
  const url = URL.createObjectURL(
    new Blob([serializeViews(views)], { type: 'application/json' }),
  );
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cairn-views.json';
    link.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function mergeViews(
  current: SavedView[],
  incoming: SavedView[],
): SavedView[] {
  if (current.length + incoming.length > 12)
    throw new Error('Combined views exceed the limit of 12.');
  const result = [...current];
  for (const view of incoming) {
    let name = view.name.trim();
    let id = view.id;
    let suffix = 1;
    while (
      result.some(
        (item) => item.name.trim().toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      name = suffixViewName(view.name, ` imported ${suffix++}`);
    }
    suffix = 1;
    while (result.some((item) => item.id === id)) id = `imported-${suffix++}`;
    result.push({ ...view, name, id });
  }
  return parseViews(JSON.stringify(result));
}
