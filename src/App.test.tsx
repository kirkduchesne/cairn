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
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: title },
  });
  fireEvent.click(screen.getByText('Add issue'));
}

test('creates, edits, changes status, filters and reloads', () => {
  const view = render(<App />);
  add();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Fix menu' }));
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'Fix navigation' },
  });
  fireEvent.click(screen.getByText('Save changes'));
  fireEvent.change(screen.getByLabelText('Status for Fix navigation'), {
    target: { value: 'Done' },
  });
  fireEvent.change(screen.getByLabelText('Filter status'), {
    target: { value: 'Open' },
  });
  expect(screen.getByText('No issues match your filters.')).toBeTruthy();
  view.unmount();
  render(<App />);
  expect(
    (screen.getByLabelText('Status for Fix navigation') as HTMLSelectElement)
      .value,
  ).toBe('Done');
});

test('searches notes and cancels editing without changes', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Notes'), {
    target: { value: 'mobile layout' },
  });
  add();
  fireEvent.change(screen.getByLabelText('Search issues'), {
    target: { value: 'MOBILE' },
  });
  expect(screen.getByText('Fix menu')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Fix menu' }));
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'Changed' },
  });
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
  expect(screen.getByRole('alert').textContent).toContain(
    'Enter an issue title',
  );
});

test('preserves form and existing data on storage failure', () => {
  render(<App />);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  add();
  expect(screen.getByRole('alert').textContent).toContain('Could not save');
  expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
    'Fix menu',
  );
  expect(screen.queryByRole('button', { name: 'Delete Fix menu' })).toBeNull();
});

test('leaves corrupt storage untouched and disables mutation', () => {
  localStorage.setItem(storageKey, '{broken');
  render(<App />);
  expect(screen.getByRole('alert').textContent).toContain(
    'Changes are disabled',
  );
  expect((screen.getByLabelText('Title').closest('fieldset') as HTMLFieldSetElement).disabled).toBe(true);
  expect(localStorage.getItem(storageKey)).toBe('{broken');
});

test('validates shape and duplicate identifiers', () => {
  expect(parseIssues(null)).toEqual([]);
  for (const value of ['{}', '[null]', '[{"id":"a"}]'])
    expect(() => parseIssues(value)).toThrow();
  const issue = { id: 'a', title: 'Task', notes: '', status: 'Open' };
  expect(() => parseIssues(JSON.stringify([issue, issue]))).toThrow();
});

test('migrates legacy issues and sorts priorities', () => {
  localStorage.setItem(
    storageKey,
    JSON.stringify([
      { id: 'old', title: 'Old task', notes: '', status: 'Open' },
    ]),
  );
  render(<App />);
  expect(screen.getByText('Normal priority')).toBeTruthy();
  expect(screen.getByText('Imported from an earlier list')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Priority'), {
    target: { value: 'High' },
  });
  add('Urgent task');
  fireEvent.change(screen.getByLabelText('Sort issues'), {
    target: { value: 'Priority' },
  });
  expect(document.querySelector('article h2')!.textContent).toBe('Urgent task');
});

test('preserves unseen changes from another tab', () => {
  render(<App />);
  localStorage.setItem(storageKey, '[]');
  add();
  expect(screen.getByRole('alert').textContent).toContain('another tab');
  expect(localStorage.getItem(storageKey)).toBe('[]');
});

test('imports only new ids and rejects invalid backups', () => {
  render(<App />);
  add();
  const existing = JSON.parse(localStorage.getItem(storageKey)!);
  const imported = { ...existing[0], id: 'imported', title: 'Imported task' };
  fireEvent.change(screen.getByLabelText('Backup JSON'), {
    target: {
      value: JSON.stringify({ version: 1, issues: [...existing, imported] }),
    },
  });
  fireEvent.click(screen.getByText('Import new issues'));
  expect(screen.getByText('Imported task')).toBeTruthy();
  expect(
    screen.getByText('Added 1 issues; skipped 1 existing IDs.'),
  ).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Backup JSON'), {
    target: { value: '{bad' },
  });
  fireEvent.click(screen.getByText('Import new issues'));
  expect(
    screen.getByText(
      'Backup is invalid or exceeds the list limit. Nothing was changed.',
    ),
  ).toBeTruthy();
  expect(JSON.parse(localStorage.getItem(storageKey)!)).toHaveLength(2);
});

test('focuses the title after edits and preserves failed imports', () => {
  render(<App />);
  add('Keyboard task');
  fireEvent.click(screen.getByRole('button', { name: 'Edit Keyboard task' }));
  expect(document.activeElement).toBe(screen.getByLabelText('Title'));
  fireEvent.click(screen.getByText('Save changes'));
  const saved = JSON.parse(localStorage.getItem(storageKey)!);
  expect(Number.isFinite(Date.parse(saved[0].updatedAt))).toBe(true);
  const backup = JSON.stringify({
    version: 1,
    issues: [{ ...saved[0], id: 'new' }],
  });
  fireEvent.change(screen.getByLabelText('Backup JSON'), {
    target: { value: backup },
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  fireEvent.click(screen.getByText('Import new issues'));
  expect(
    (screen.getByLabelText('Backup JSON') as HTMLTextAreaElement).value,
  ).toBe(backup);
  expect(JSON.parse(localStorage.getItem(storageKey)!)).toHaveLength(1);
});

test('reports backup download failure without changing issues', () => {
  render(<App />);
  add('Keep this issue');
  const before = localStorage.getItem(storageKey);
  const original = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: () => {
      throw new Error('download unavailable');
    },
  });
  try {
    fireEvent.click(screen.getByText('Export backup'));
    expect(screen.getByText(/Backup download could not start/)).toBeTruthy();
    expect(localStorage.getItem(storageKey)).toBe(before);
  } finally {
    if (original) Object.defineProperty(URL, 'createObjectURL', original);
    else delete (URL as unknown as Record<string, unknown>).createObjectURL;
  }
});

test('updates the live announcement for consecutive identical actions', () => {
  render(<App />);
  add('First task');
  const announcement = screen.getByText('Issue added. Action 1.');
  add('Second task');
  expect(announcement.textContent).toBe('Issue added. Action 2.');
  for (const title of ['First task', 'Second task']) {
    fireEvent.click(screen.getByRole('button', { name: `Edit ${title}` }));
    fireEvent.click(screen.getByText('Save changes'));
  }
  expect(announcement.textContent).toBe('Issue updated. Action 4.');
});
