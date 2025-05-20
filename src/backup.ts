import { Issue, parseIssues } from './storage';

export function serializeBackup(issues: Issue[]): string {
  return JSON.stringify({ version: 1, issues }, null, 2);
}

export function parseBackup(raw: string): Issue[] {
  if (raw.length > 1000000)
    throw new Error('Backup exceeds one million characters.');
  const data = JSON.parse(raw);
  if (!data || data.version !== 1 || !Array.isArray(data.issues)) {
    throw new Error('Choose an Issue Desk version 1 backup.');
  }
  if (data.issues.length > 500) throw new Error('Backup exceeds 500 issues.');
  return parseIssues(JSON.stringify(data.issues));
}

export function backupFilename(scope: 'all' | 'visible', now = new Date()): string {
  return `issue-desk-${scope}-${now.toISOString().slice(0, 10)}.json`;
}

export function downloadBackup(issues: Issue[], scope: 'all' | 'visible' = 'all') {
  const url = URL.createObjectURL(
    new Blob([serializeBackup(issues)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFilename(scope);
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function mergeBackup(current: Issue[], incoming: Issue[]): Issue[] {
  const existing = new Set(current.map((issue) => issue.id));
  const merged = [
    ...current,
    ...incoming.filter((issue) => !existing.has(issue.id)),
  ];
  if (merged.length > 500) throw new Error('Combined list exceeds 500 issues.');
  return merged;
}
