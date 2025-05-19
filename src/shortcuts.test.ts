// @vitest-environment jsdom
import { expect, test } from 'vitest';
import { shortcutTarget } from './shortcuts';
test('requires explicit unmodified alt shortcut outside composition', () => {
  expect(shortcutTarget(new KeyboardEvent('keydown', { key: 'n', altKey: true }))).toBe('title');
  expect(shortcutTarget(new KeyboardEvent('keydown', { key: 'f', altKey: true }))).toBe('search');
  for (const options of [{}, { altKey: true, ctrlKey: true }, { altKey: true, isComposing: true }, { altKey: true, repeat: true }, { altKey: true, shiftKey: true }]) {
    expect(shortcutTarget(new KeyboardEvent('keydown', { key: 'n', ...options }))).toBeNull();
  }
});
