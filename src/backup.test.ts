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
  expect(() => parseBackup(' '.repeat(5000001))).toThrow();
  const many = Array.from({ length: 500 }, (_, index) => ({
    ...issues[0],
    id: String(index),
  }));
  expect(() => mergeBackup(many, [{ ...issues[0], id: 'extra' }])).toThrow();
});

test('round trips 500 issues with maximum JSON-escaped content', () => {
  const large = Array.from({ length: 500 }, (_, index) => ({
    ...issues[0],
    id: String(index),
    title: 'x'.repeat(100),
    notes: '\u0000'.repeat(1000),
  }));
  const raw = serializeBackup(large);
  expect(raw.length).toBeGreaterThan(1000000);
  expect(parseBackup(raw)).toEqual(large);
});

test('refuses exports that exceed the same limits used for import', () => {
  expect(() =>
    serializeBackup(
      Array.from({ length: 501 }, (_, index) => ({
        ...issues[0],
        id: String(index),
      })),
    ),
  ).toThrow('500 issues');
  expect(() =>
    serializeBackup([{ ...issues[0], id: 'x'.repeat(5000000) }]),
  ).toThrow('five million');
});
