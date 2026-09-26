import { expect, test } from 'vitest';
import { normalizeTags } from './tags';
import { parseIssues } from './storage';
test('normalizes tags and rejects invalid bounded lists', () => {
  expect(normalizeTags([' Web ', 'web', '', 'BUG'])).toEqual(['web', 'bug']);
  for (const value of [
    null,
    [2],
    ['x'.repeat(25)],
    ['bad,tag'],
    ['a', 'b', 'c', 'd', 'e', 'f'],
  ]) {
    expect(() => normalizeTags(value)).toThrow();
  }
  expect(() =>
    parseIssues(
      JSON.stringify([
        { id: '1', title: 't', notes: '', status: 'Open', tags: 3 },
      ]),
    ),
  ).toThrow();
});
import { queryIssues, defaultQuery } from './query';
test('searches tags without case sensitivity and combines tag filters', () => {
  const issues = parseIssues(
    JSON.stringify([
      { id: '1', title: 'Task', notes: '', status: 'Open', tags: ['browser'] },
    ]),
  );
  expect(
    queryIssues(issues, { ...defaultQuery, text: 'BROWSER', tag: 'browser' }),
  ).toHaveLength(1);
  expect(queryIssues(issues, { ...defaultQuery, tag: 'other' })).toHaveLength(
    0,
  );
});
import { parseBackup, serializeBackup } from './backup';
test('roundtrips maximum escaped tag names', () => {
  const issues = parseIssues(
    JSON.stringify([
      {
        id: '1',
        title: 'Task',
        notes: '',
        status: 'Open',
        tags: ['"'.repeat(24), '\\'.repeat(24), 'c', 'd', 'e'],
      },
    ]),
  );
  expect(parseBackup(serializeBackup(issues))).toEqual(issues);
});
import { tagSelected } from './tags';
test('tag batch changes are pure and reject a partially valid batch', () => {
  const issues = parseIssues(
    JSON.stringify([
      { id: '1', title: 'First', notes: '', status: 'Open', tags: [] },
      {
        id: '2',
        title: 'Full',
        notes: '',
        status: 'Open',
        tags: ['a', 'b', 'c', 'd', 'e'],
      },
    ]),
  );
  const before = JSON.stringify(issues);
  expect(() => tagSelected(issues, ['1', '2'], 'sixth')).toThrow();
  expect(JSON.stringify(issues)).toBe(before);
  expect(tagSelected(issues, ['2'], 'a')[1]).toBe(issues[1]);
  expect(tagSelected(issues, ['2'], 'a', true)[1].tags).toEqual([
    'b',
    'c',
    'd',
    'e',
  ]);
});
