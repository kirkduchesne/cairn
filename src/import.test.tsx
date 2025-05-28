// @vitest-environment jsdom
import { beforeEach, afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { storageKey } from './storage';
const backup = JSON.stringify({ version: 1, issues: [{ id: 'a', title: 'Imported', notes: '', status: 'Open' }] });
beforeEach(() => localStorage.clear());
afterEach(cleanup);
function preview() {
  fireEvent.change(screen.getByLabelText('Backup JSON'), { target: { value: backup } });
  fireEvent.click(screen.getByText('Preview backup'));
}
test('cancelled previews never mutate stored issues', () => {
  render(<App />); preview();
  expect(screen.getByText(/1 new, 0 existing/)).toBeTruthy();
  fireEvent.click(screen.getByText('Cancel import'));
  expect(localStorage.getItem(storageKey)).toBeNull();
  expect(screen.queryByText('Import new issues')).toBeNull();
});
test('external changes after preview prevent confirmation from overwriting them', () => {
  render(<App />); preview();
  localStorage.setItem(storageKey, '[]');
  fireEvent.click(screen.getByText('Import new issues'));
  expect(localStorage.getItem(storageKey)).toBe('[]');
  expect(screen.getByText(/Saved issues changed in another tab/)).toBeTruthy();
});
