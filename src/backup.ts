import { Issue, parseIssues } from './storage';

export function serializeBackup(issues: Issue[]): string {
  return JSON.stringify({ version: 1, issues }, null, 2);
}

export function parseBackup(raw: string): Issue[] {
  const data = JSON.parse(raw);
  if (!data || data.version !== 1 || !Array.isArray(data.issues)) {
    throw new Error('Choose an Issue Desk version 1 backup.');
  }
  return parseIssues(JSON.stringify(data.issues));
}

export function downloadBackup(issues: Issue[]) {
  const url = URL.createObjectURL(new Blob([serializeBackup(issues)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'issue-desk-backup.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
