// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { backupFilename, downloadBackup, serializeBackup } from './backup';
import { defaultQuery, queryIssues } from './query';
import { parseIssues } from './storage';
afterEach(() => vi.restoreAllMocks());
test('filtered backup contains only results and leaves source intact', () => {
  const rows = parseIssues(JSON.stringify([{ id: 'a', title: 'A', notes: '', status: 'Open' }, { id: 'b', title: 'B', notes: '', status: 'Done' }]));
  const visible = queryIssues(rows, { ...defaultQuery, status: 'Open' });
  expect(JSON.parse(serializeBackup(visible)).issues.map((issue: { id: string }) => issue.id)).toEqual(['a']);
  expect(rows).toHaveLength(2);
  expect(backupFilename('visible', new Date('2025-05-20T23:30:00-04:00'))).toBe('issue-desk-visible-2025-05-21.json');
});
test('creation failures propagate without changing input', () => {
  const original = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => { throw new Error('unavailable'); } });
  try { expect(() => downloadBackup([])).toThrow('unavailable'); }
  finally { if (original) Object.defineProperty(URL, 'createObjectURL', original); else delete (URL as unknown as Record<string, unknown>).createObjectURL; }
});
test('revokes temporary download URLs even if the browser click fails', () => {
  vi.useFakeTimers();
  const create = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const revoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  const release = vi.fn();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:test' });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: release });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('blocked'); });
  try {
    expect(() => downloadBackup([])).toThrow('blocked');
    vi.runAllTimers();
    expect(release).toHaveBeenCalledWith('blob:test');
  } finally {
    for (const [key, descriptor] of [['createObjectURL', create], ['revokeObjectURL', revoke]] as const) {
      if (descriptor) Object.defineProperty(URL, key, descriptor);
      else delete (URL as unknown as Record<string, unknown>)[key];
    }
    vi.useRealTimers();
  }
});
