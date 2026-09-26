import { expect, test } from 'vitest';
import { parseIssues } from './storage';
const record = { id: '1', title: 'Task', notes: '', status: 'Done' };
test('accepts legacy active records and rejects invalid archive state', () => {
  expect(parseIssues(JSON.stringify([record]))[0].archived ?? false).toBe(
    false,
  );
  expect(
    parseIssues(JSON.stringify([{ ...record, archived: true }]))[0].archived,
  ).toBe(true);
  expect(() =>
    parseIssues(JSON.stringify([{ ...record, archived: 'yes' }])),
  ).toThrow();
  expect(() =>
    parseIssues(
      JSON.stringify([{ ...record, status: 'Open', archived: true }]),
    ),
  ).toThrow();
});
import { parseBackup, serializeBackup } from './backup';
import { queryIssues, defaultQuery } from './query';
test('roundtrips archive tags and scopes old issues as active', () => {
  const issues = parseIssues(
    JSON.stringify([
      record,
      { ...record, id: '2', archived: true, tags: ['done'] },
    ]),
  );
  expect(parseBackup(serializeBackup(issues))).toEqual(issues);
  expect(queryIssues(issues, defaultQuery).map((item) => item.id)).toEqual([
    '1',
  ]);
  expect(
    queryIssues(issues, { ...defaultQuery, scope: 'Archived' }).map(
      (item) => item.id,
    ),
  ).toEqual(['2']);
  expect(queryIssues(issues, { ...defaultQuery, scope: 'All' })).toHaveLength(
    2,
  );
});
test('sorts updates with unknown legacy dates last in either direction', () => {
  const issues = parseIssues(
    JSON.stringify([
      record,
      { ...record, id: '2', updatedAt: '2026-01-01' },
      { ...record, id: '3', updatedAt: '2026-03-01' },
    ]),
  );
  expect(
    queryIssues(issues, { ...defaultQuery, order: 'Newest' }).map(
      (issue) => issue.id,
    ),
  ).toEqual(['3', '2', '1']);
  expect(
    queryIssues(issues, { ...defaultQuery, order: 'Oldest' }).map(
      (issue) => issue.id,
    ),
  ).toEqual(['2', '3', '1']);
});
