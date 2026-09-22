import { Issue } from './storage';

export type Query = {
  group?: 'None' | 'Status' | 'Priority';
  tag?: string;
  scope?: 'Active' | 'Archived' | 'All';
  text: string;
  status: string;
  priority: string;
  order: string;
};
export const defaultQuery: Query = {
  text: '',
  status: 'All',
  priority: 'All',
  order: 'Added',
};

export function queryIssues(issues: Issue[], query: Query): Issue[] {
  const text = query.text.trim().toLowerCase();
  const result = issues.filter(
    (issue) =>
      (query.scope === 'All' ||
        (query.scope === 'Archived'
          ? Boolean(issue.archived)
          : !issue.archived)) &&
      (!query.tag || (issue.tags ?? []).includes(query.tag)) &&
      (query.status === 'All' || issue.status === query.status) &&
      (query.priority === 'All' || issue.priority === query.priority) &&
      [issue.title, issue.notes, ...(issue.tags ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(text),
  );
  if (query.order === 'Newest' || query.order === 'Oldest') {
    result.sort((a, b) => {
      if (!a.updatedAt) return b.updatedAt ? 1 : 0;
      if (!b.updatedAt) return -1;
      const delta = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
      return query.order === 'Newest' ? -delta : delta;
    });
  } else if (query.order === 'Priority') {
    const rank = { High: 0, Normal: 1, Low: 2 };
    result.sort((a, b) => rank[a.priority] - rank[b.priority]);
  } else if (query.order === 'Title')
    result.sort((a, b) => a.title.localeCompare(b.title));
  return result;
}

export function groupIssues(
  issues: Issue[],
  group: Query['group'],
): { name: string; issues: Issue[] }[] {
  if (!group || group === 'None') return [{ name: '', issues }];
  const names =
    group === 'Priority'
      ? ['High', 'Normal', 'Low']
      : ['Open', 'In progress', 'Done'];
  return names
    .map((name) => ({
      name,
      issues: issues.filter(
        (issue) =>
          (group === 'Priority' ? issue.priority : issue.status) === name,
      ),
    }))
    .filter((section) => section.issues.length > 0);
}
