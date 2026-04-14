// @vitest-environment jsdom
import { expect, test, afterEach, vi } from 'vitest';
import { mergeViews, parseViewBackup, serializeViews } from './view-backup';
import { defaultQuery } from './query';
import { persistViews, viewsKey } from './views';
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
const view = { id: '1', name: 'Daily', query: { ...defaultQuery, scope: 'Archived' as const, tag: 'web', group: 'Priority' as const } };
test('roundtrips richer views and renames collisions without overwriting', () => {
  expect(parseViewBackup(serializeViews([view]))).toEqual([view]);
  const result = mergeViews([view], [view]);
  expect(result[0]).toEqual(view);
  expect(result[1].id).not.toBe(view.id);
  expect(result[1].name).not.toBe(view.name);
  expect(result[1].query).toEqual(view.query);
  expect(() => mergeViews(Array.from({ length: 12 }, (_, i) => ({ ...view, id: `${i}`, name: `${i}` })), [view])).toThrow();
});
test('rejects oversized or malformed view backups and preserves snapshot conflicts', () => {
  expect(() => parseViewBackup('x'.repeat(100001))).toThrow();
  expect(() => parseViewBackup('{"version":1,"views":[]}')).toThrow();
  localStorage.setItem(viewsKey, '[]');
  expect(() => persistViews([view], null)).toThrow();
  expect(localStorage.getItem(viewsKey)).toBe('[]');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  expect(() => persistViews([view], '[]')).toThrow();
  expect(localStorage.getItem(viewsKey)).toBe('[]');
});
