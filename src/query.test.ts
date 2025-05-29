import { expect, test } from 'vitest';
import { defaultQuery, queryIssues } from './query';
import { Issue } from './storage';
const issues: Issue[] = [
  {
    id: '1',
    title: 'Beta',
    notes: 'Menu',
    status: 'Open',
    priority: 'High',
    updatedAt: null,
  },
  {
    id: '2',
    title: 'Alpha',
    notes: 'Menu',
    status: 'Done',
    priority: 'Low',
    updatedAt: null,
  },
  {
    id: '3',
    title: 'Gamma',
    notes: '',
    status: 'Open',
    priority: 'High',
    updatedAt: null,
  },
];
test('combines text status and priority without mutating records', () => {
  const before = JSON.stringify(issues);
  expect(
    queryIssues(issues, {
      ...defaultQuery,
      text: ' MENU ',
      status: 'Open',
      priority: 'High',
    }).map((i) => i.id),
  ).toEqual(['1']);
  expect(
    queryIssues(issues, { ...defaultQuery, order: 'Title' }).map((i) => i.id),
  ).toEqual(['2', '1', '3']);
  expect(JSON.stringify(issues)).toBe(before);
});
test('retains added order within equal priorities', () => {
  expect(
    queryIssues(issues, { ...defaultQuery, order: 'Priority' }).map(
      (i) => i.id,
    ),
  ).toEqual(['1', '3', '2']);
});
