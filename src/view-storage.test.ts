// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest';
import { defaultQuery } from './query';
import { loadViews, persistViews, viewsKey } from './views';
beforeEach(() => localStorage.clear());
test('refuses concurrent changes without overwriting them', () => {
  const initial = loadViews();
  localStorage.setItem(viewsKey, '[]');
  expect(() =>
    persistViews([{ id: '1', name: 'View', query: defaultQuery }], initial.raw),
  ).toThrow('another tab');
  expect(localStorage.getItem(viewsKey)).toBe('[]');
});
test('preserves corrupt view storage for recovery', () => {
  localStorage.setItem(viewsKey, '{bad');
  expect(loadViews().error).toContain('preserved');
  expect(localStorage.getItem(viewsKey)).toBe('{bad');
});
