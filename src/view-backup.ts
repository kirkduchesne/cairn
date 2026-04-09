import { SavedView, parseViews } from './views';
export const viewBackupLimit = 100_000;
export function parseViewBackup(raw: string): SavedView[] {
  if (raw.length > viewBackupLimit) throw new Error('View backup exceeds 100,000 characters.');
  const data = JSON.parse(raw);
  if (!data || data.kind !== 'issue-desk-views' || data.version !== 1) throw new Error('Choose an Issue Desk views backup.');
  return parseViews(JSON.stringify(data.views));
}
export function serializeViews(views: SavedView[]): string {
  const raw = JSON.stringify({ kind: 'issue-desk-views', version: 1, views }, null, 2);
  parseViewBackup(raw);
  return raw;
}
export function downloadViews(views: SavedView[]) {
  const url = URL.createObjectURL(new Blob([serializeViews(views)], { type: 'application/json' }));
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'issue-desk-views.json';
    link.click();
  } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
