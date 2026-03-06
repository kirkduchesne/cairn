import { expect, test } from 'vitest';
import { normalizeTags } from './tags';
import { parseIssues } from './storage';
test('normalizes tags and rejects invalid bounded lists', () => {
  expect(normalizeTags([' Web ', 'web', '', 'BUG'])).toEqual(['web', 'bug']);
  for (const value of [null, [2], ['x'.repeat(25)], ['bad,tag'], ['a','b','c','d','e','f']]) {
    expect(() => normalizeTags(value)).toThrow();
  }
  expect(() => parseIssues(JSON.stringify([{ id: '1', title: 't', notes: '', status: 'Open', tags: 3 }]))).toThrow();
});
import { queryIssues, defaultQuery } from './query';
test('searches tags without case sensitivity and combines tag filters', () => {
  const issues = parseIssues(JSON.stringify([{ id: '1', title: 'Task', notes: '', status: 'Open', tags: ['browser'] }]));
  expect(queryIssues(issues, { ...defaultQuery, text: 'BROWSER', tag: 'browser' })).toHaveLength(1);
  expect(queryIssues(issues, { ...defaultQuery, tag: 'other' })).toHaveLength(0);
});
