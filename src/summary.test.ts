import { expect, test } from 'vitest';
import { parseIssues } from './storage';
import { summarize } from './summary';
test('attention excludes completed high-priority work', () => {
  const rows = parseIssues(JSON.stringify([
    { id: 'a', title: 'A', notes: '', status: 'Done', priority: 'High' },
    { id: 'b', title: 'B', notes: '', status: 'Open', priority: 'High' },
    { id: 'c', title: 'C', notes: '', status: 'In progress', priority: 'Normal' },
  ]));
  expect(summarize(rows)).toEqual({ total: 3, attention: 1, Open: 1, 'In progress': 1, Done: 1 });
});
