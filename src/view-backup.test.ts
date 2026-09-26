// @vitest-environment jsdom
import { expect, test, afterEach, vi } from 'vitest';
import { mergeViews, parseViewBackup, serializeViews } from './view-backup';
import { defaultQuery } from './query';
import { persistViews, viewsKey } from './views';
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
const view = {
  id: '1',
  name: 'Daily',
  query: {
    ...defaultQuery,
    scope: 'Archived' as const,
    tag: 'web',
    group: 'Priority' as const,
  },
};
test('roundtrips richer views and renames collisions without overwriting', () => {
  expect(parseViewBackup(serializeViews([view]))).toEqual([view]);
  const result = mergeViews([view], [view]);
  expect(result[0]).toEqual(view);
  expect(result[1].id).not.toBe(view.id);
  expect(result[1].name).not.toBe(view.name);
  expect(result[1].query).toEqual(view.query);
  expect(() =>
    mergeViews(
      Array.from({ length: 12 }, (_, i) => ({
        ...view,
        id: `${i}`,
        name: `${i}`,
      })),
      [view],
    ),
  ).toThrow();
});
test('rejects oversized or malformed view backups and preserves snapshot conflicts', () => {
  expect(() => parseViewBackup('x'.repeat(100001))).toThrow();
  expect(() => parseViewBackup('{"version":1,"views":[]}')).toThrow();
  localStorage.setItem(viewsKey, '[]');
  expect(() => persistViews([view], null)).toThrow();
  expect(localStorage.getItem(viewsKey)).toBe('[]');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(() => persistViews([view], '[]')).toThrow();
  expect(localStorage.getItem(viewsKey)).toBe('[]');
});

test('renames padded and differently cased imported names consistently', () => {
  const incoming = parseViewBackup(
    serializeViews([{ ...view, name: ' Daily ' }]),
  );
  const result = mergeViews([view], incoming);
  expect(result[0]).toEqual(view);
  expect(result[1].name.trim().toLowerCase()).not.toBe('daily');
  expect(parseViewBackup(serializeViews(result))).toEqual(result);
  const caseResult = mergeViews([view], [{ ...view, name: 'DAILY' }]);
  expect(caseResult[1].name.toLowerCase()).not.toBe('daily');
});

import { copyView, parseViews, type SavedView } from './views';

test('copies and imports Unicode names without splitting characters or exceeding forty units', () => {
  for (const name of [
    '😀'.repeat(20),
    'a' + '😀'.repeat(19) + 'b',
    'x'.repeat(27) + '😀'.repeat(6) + 'y',
    'x'.repeat(40),
  ]) {
    const original = { ...view, name };
    let copies: SavedView[] = [original];
    let imports: SavedView[] = [original];
    for (let index = 0; index < 10; index += 1) {
      const copy = copyView(original, copies);
      copies = [...copies, copy];
      imports = mergeViews(imports, [original]);
      for (const result of [copy, imports[imports.length - 1]]) {
        expect(result.name.length).toBeLessThanOrEqual(40);
        expect(
          Array.from(result.name).every(
            (character) =>
              character.length === 2 || !/[\uD800-\uDFFF]/.test(character),
          ),
        ).toBe(true);
      }
      expect(parseViews(JSON.stringify(copies))).toEqual(copies);
      expect(parseViewBackup(serializeViews(imports))).toEqual(imports);
    }
    expect(copies[10].name.endsWith(' copy 10')).toBe(true);
    expect(imports[10].name.endsWith(' imported 10')).toBe(true);
    expect(new Set(copies.map((item) => item.name)).size).toBe(11);
    expect(new Set(imports.map((item) => item.name)).size).toBe(11);
  }
  expect(() =>
    parseViews(JSON.stringify([{ ...view, name: '😀'.repeat(40) }])),
  ).toThrow();
});
