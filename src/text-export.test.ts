// @vitest-environment jsdom
import { expect, test, vi, afterEach } from 'vitest';
import { resultSummary, downloadText } from './text-export';
import { defaultQuery, queryIssues } from './query';
import { parseIssues } from './storage';
afterEach(() => vi.restoreAllMocks());
test('summarizes only the chosen scope', () => {
  const issues = parseIssues(JSON.stringify([{ id: '1', title: 'Archived', notes: '', status: 'Done', archived: true }, { id: '2', title: 'Active', notes: '', status: 'Open' }]));
  const query = { ...defaultQuery, scope: 'Archived' as const };
  expect(resultSummary(queryIssues(issues, query), query)).toContain('Results: 1; open: 0; in progress: 0; done: 1');
});
test('propagates unavailable download errors without writes', () => {
  const original = URL.createObjectURL;
  URL.createObjectURL = () => { throw new Error('blocked'); };
  try { expect(() => downloadText('summary', 'report.txt')).toThrow('blocked'); }
  finally { URL.createObjectURL = original; }
});
