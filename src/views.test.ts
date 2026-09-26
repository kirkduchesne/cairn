import { expect, test } from 'vitest';
import { defaultQuery } from './query';
import { parseViews } from './views';
const view = { id: 'one', name: 'Open work', query: defaultQuery };
test('validates bounded named views and unique names', () => {
  expect(parseViews(null)).toEqual([]);
  expect(parseViews(JSON.stringify([view]))).toEqual([view]);
  for (const value of [
    [view, view],
    [{ ...view, name: '' }],
    [{ ...view, query: { ...defaultQuery, status: 'Missing' } }],
  ]) {
    expect(() => parseViews(JSON.stringify(value))).toThrow();
  }
});
