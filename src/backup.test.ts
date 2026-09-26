import { expect, test } from 'vitest';
import { mergeBackup, parseBackup, serializeBackup } from './backup';
import { parseIssues } from './storage';

const issues = parseIssues(
  JSON.stringify([{ id: 'a', title: 'Original', notes: '', status: 'Open' }]),
);
test('round trips a backup including migrated defaults', () => {
  expect(parseBackup(serializeBackup(issues))).toEqual(issues);
});
test('keeps current values when imported ids overlap', () => {
  expect(mergeBackup(issues, [{ ...issues[0], title: 'Replacement' }])).toEqual(
    issues,
  );
});
test('rejects bad versions priorities and timestamps', () => {
  for (const value of [
    { version: 2, issues },
    { version: 1, issues: [{ ...issues[0], priority: 'Urgent' }] },
    { version: 1, issues: [{ ...issues[0], updatedAt: 'yesterday' }] },
  ]) {
    expect(() => parseBackup(JSON.stringify(value))).toThrow();
  }
});
test('rejects oversized input and combined lists', () => {
  expect(() => parseBackup(' '.repeat(1000001))).toThrow();
  const many = Array.from({ length: 500 }, (_, index) => ({
    ...issues[0],
    id: String(index),
  }));
  expect(() => mergeBackup(many, [{ ...issues[0], id: 'extra' }])).toThrow();
});
