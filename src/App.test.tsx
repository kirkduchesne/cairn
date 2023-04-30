// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { parseIssues, storageKey } from './storage';

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function add(title = 'Fix menu') {
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: title } });
  fireEvent.click(screen.getByText('Add issue'));
}

test('creates, edits, changes status, filters and reloads', () => {
  const view = render(<App />);
  add();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Fix menu' }));
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fix navigation' } });
  fireEvent.click(screen.getByText('Save changes'));
  fireEvent.change(screen.getByLabelText('Status for Fix navigation'), {
    target: { value: 'Done' },
  });
  fireEvent.change(screen.getByLabelText('Filter status'), { target: { value: 'Open' } });
  expect(screen.getByText('No issues match your filters.')).toBeTruthy();
  view.unmount();
  render(<App />);
  expect((screen.getByLabelText('Status for Fix navigation') as HTMLSelectElement).value).toBe(
    'Done'
  );
});

test('searches notes and cancels editing without changes', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'mobile layout' } });
  add();
  fireEvent.change(screen.getByLabelText('Search issues'), { target: { value: 'MOBILE' } });
  expect(screen.getByText('Fix menu')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Fix menu' }));
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Changed' } });
  fireEvent.click(screen.getByText('Cancel editing'));
  expect(screen.getByText('Fix menu')).toBeTruthy();
});

test('confirms deletion', () => {
  render(<App />);
  add();
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  fireEvent.click(screen.getByRole('button', { name: 'Delete Fix menu' }));
  expect(screen.getByText('Fix menu')).toBeTruthy();
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Delete Fix menu' }));
  expect(screen.queryByText('Fix menu')).toBeNull();
  expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual([]);
});

test('rejects whitespace title', () => {
  render(<App />);
  add('   ');
  expect(screen.getByRole('alert').textContent).toContain('Enter an issue title');
});

test('preserves form and existing data on storage failure', () => {
  render(<App />);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  add();
  expect(screen.getByRole('alert').textContent).toContain('Could not save');
  expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Fix menu');
  expect(screen.queryByRole('button', { name: 'Delete Fix menu' })).toBeNull();
});

test('leaves corrupt storage untouched and disables mutation', () => {
  localStorage.setItem(storageKey, '{broken');
  render(<App />);
  expect(screen.getByRole('alert').textContent).toContain('Changes are disabled');
  expect(document.querySelector('fieldset')!.disabled).toBe(true);
  expect(localStorage.getItem(storageKey)).toBe('{broken');
});

test('validates shape and duplicate identifiers', () => {
  expect(parseIssues(null)).toEqual([]);
  for (const value of ['{}', '[null]', '[{"id":"a"}]']) expect(() => parseIssues(value)).toThrow();
  const issue = { id: 'a', title: 'Task', notes: '', status: 'Open' };
  expect(() => parseIssues(JSON.stringify([issue, issue]))).toThrow();
});
