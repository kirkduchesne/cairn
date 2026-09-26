import { Issue } from './storage';
export function changeSelected(
  issues: Issue[],
  ids: string[],
  patch: Partial<Pick<Issue, 'status' | 'priority'>>,
  timestamp: string,
): Issue[] {
  const selected = new Set(ids);
  return issues.map((issue) => {
    if (
      !selected.has(issue.id) ||
      Object.entries(patch).every(
        ([key, value]) => issue[key as 'status' | 'priority'] === value,
      )
    )
      return issue;
    return { ...issue, ...patch, updatedAt: timestamp };
  });
}
