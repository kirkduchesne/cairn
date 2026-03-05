import { Issue } from './storage';

export type Query = {
  tag?: string;
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
      (!query.tag || (issue.tags ?? []).includes(query.tag)) &&
      (query.status === 'All' || issue.status === query.status) &&
      (query.priority === 'All' || issue.priority === query.priority) &&
      (issue.title + ' ' + issue.notes).toLowerCase().includes(text),
  );
  if (query.order === 'Priority') {
    const rank = { High: 0, Normal: 1, Low: 2 };
    result.sort((a, b) => rank[a.priority] - rank[b.priority]);
  } else if (query.order === 'Title')
    result.sort((a, b) => a.title.localeCompare(b.title));
  return result;
}
