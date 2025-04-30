// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { storageKey } from './storage';
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(storageKey, JSON.stringify([{ id: 'a', title: 'Task A', notes: '', status: 'Open' }, { id: 'b', title: 'Task B', notes: '', status: 'Open' }]));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
test('failed batch write preserves data and selection', () => {
  render(<App />);
  fireEvent.click(screen.getByLabelText('Select Task A'));
  const before = localStorage.getItem(storageKey);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  fireEvent.click(screen.getByText('Apply status'));
  expect((screen.getByLabelText('Select Task A') as HTMLInputElement).checked).toBe(true);
  expect((screen.getByLabelText('Status for Task A') as HTMLSelectElement).value).toBe('Open');
  expect(localStorage.getItem(storageKey)).toBe(before);
});
