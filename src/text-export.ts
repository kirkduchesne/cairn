import { Issue } from './storage';
import { Query } from './query';
import { summarize } from './summary';
export function resultSummary(issues: Issue[], query: Query): string {
  const counts = summarize(issues);
  return [
    'Issue Desk result summary',
    `Scope: ${query.scope ?? 'Active'}`,
    `Status: ${query.status}; priority: ${query.priority}; tag: ${query.tag || 'All'}`,
    `Search: ${query.text || 'None'}`,
    `Results: ${counts.total}; open: ${counts.Open}; in progress: ${counts['In progress']}; done: ${counts.Done}`,
    `Unfinished high priority: ${counts.attention}`,
  ].join('\n');
}
export function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
