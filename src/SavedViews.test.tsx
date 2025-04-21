// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SavedViews } from './SavedViews';
import { defaultQuery } from './query';
import { viewsKey } from './views';
beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
test('failed saves preserve entered name and never apply filters', () => {
  const apply = vi.fn();
  render(<SavedViews query={defaultQuery} onApply={apply} />);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage full'); });
  fireEvent.change(screen.getByLabelText('View name'), { target: { value: 'Work' } });
  fireEvent.click(screen.getByText('Save new view'));
  expect((screen.getByLabelText('View name') as HTMLInputElement).value).toBe('Work');
  expect(screen.getByRole('status').textContent).toContain('Storage full');
  expect(apply).not.toHaveBeenCalled();
  expect(localStorage.getItem(viewsKey)).toBeNull();
});
