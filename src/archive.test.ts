import { expect, test } from 'vitest';
import { parseIssues } from './storage';
const record = { id: '1', title: 'Task', notes: '', status: 'Done' };
test('accepts legacy active records and rejects invalid archive state', () => {
  expect(parseIssues(JSON.stringify([record]))[0].archived ?? false).toBe(false);
  expect(parseIssues(JSON.stringify([{ ...record, archived: true }]))[0].archived).toBe(true);
  expect(() => parseIssues(JSON.stringify([{ ...record, archived: 'yes' }]))).toThrow();
  expect(() => parseIssues(JSON.stringify([{ ...record, status: 'Open', archived: true }]))).toThrow();
});
