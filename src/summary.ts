import { Issue } from './storage';
export function summarize(issues: Issue[]) {
  return {
    total: issues.length,
    attention: issues.filter(
      (issue) => issue.priority === 'High' && issue.status !== 'Done',
    ).length,
    Open: issues.filter((issue) => issue.status === 'Open').length,
    'In progress': issues.filter((issue) => issue.status === 'In progress')
      .length,
    Done: issues.filter((issue) => issue.status === 'Done').length,
  };
}
