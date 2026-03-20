import { normalizeTags, tagSelected } from './tags';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { downloadBackup, parseBackup, mergeBackup } from './backup';
import { shortcutTarget } from './shortcuts';
import { summarize } from './summary';
import { changeSelected } from './batch';
import { SavedViews } from './SavedViews';
import { queryIssues } from './query';
import { Issue, loadIssues, storageKey } from './storage';

export function App() {
  const [initial] = useState(loadIssues);
  const savedSnapshot = useRef(initial.raw);
  const titleInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = shortcutTarget(event);
      if (!target) return;
      event.preventDefault();
      (target === 'title' ? titleInput : searchInput).current?.focus();
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);
  const [announcement, setAnnouncement] = useState('');
  const actionNumber = useRef(0);

  function announce(message: string) {
    actionNumber.current += 1;
    setAnnouncement(`${message} Action ${actionNumber.current}.`);
  }
  const [exportMessage, setExportMessage] = useState('');
  const [issues, updateIssues] = useState<Issue[]>(initial.issues);
  const counts = summarize(issues);
  const [storageError, setStorageError] = useState(initial.error);

  const [undo, setUndo] = useState<Issue[] | null>(null);
  function setIssues(next: Issue[]) {
    if (initial.error) return false;
    try {
      if (localStorage.getItem(storageKey) !== savedSnapshot.current) {
        setStorageError(
          'Saved issues changed in another tab. Export your current list, then reload before making changes.',
        );
        return false;
      }
      const raw = JSON.stringify(next);
      localStorage.setItem(storageKey, raw);
      savedSnapshot.current = raw;
      updateIssues(next);
      setSelected([]);
      setUndo(null);
      setStorageError('');
      return true;
    } catch {
      setStorageError(
        'Could not save changes. Free browser storage and try again.',
      );
      return false;
    }
  }
  const [batchTag, setBatchTag] = useState('');
  function applyTag(remove = false) {
    if (selectedVisible.some((issue) => issue.archived)) return;
    try {
      const next = tagSelected(issues, selectedVisible.map((issue) => issue.id), batchTag, remove);
      if (next.every((issue, index) => issue === issues[index])) {
        announce('Selected tags already match.');
      } else if (setIssues(next)) {
        setUndo(issues);
        announce('Selected issue tags updated.');
      }
    } catch (error) {
      announce(error instanceof Error ? error.message : 'Tags could not be changed.');
    }
  }
  const [tags, setTags] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Issue['priority']>('Normal');
  const [scope, setScope] = useState<'Active' | 'Archived' | 'All'>('Active');
  const [tagFilter, setTagFilter] = useState('');
  const [filter, setFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState('Added');
  const visible = queryIssues(issues, {
    scope,
    tag: tagFilter,
    text: query,
    status: filter,
    priority: priorityFilter,
    order,
  });
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    setSelected([]);
  }, [query, filter, priorityFilter, order, tagFilter, scope]);
  const [batchStatus, setBatchStatus] = useState<Issue['status']>('Done');
  const [batchPriority, setBatchPriority] = useState<Issue['priority']>('High');
  function applyBatch(patch: Partial<Pick<Issue, 'status' | 'priority'>>) {
    if (selectedVisible.some((issue) => issue.archived)) return;
    const ids = visible
      .filter((issue) => selected.includes(issue.id))
      .map((issue) => issue.id);
    const next = changeSelected(issues, ids, patch, new Date().toISOString());
    if (next.every((issue, index) => issue === issues[index])) {
      announce('Selected issues already match.');
      return;
    }
    if (setIssues(next)) {
      setUndo(issues);
      setSelected([]);
      announce(
        `${
          next.filter((issue, index) => issue !== issues[index]).length
        } selected issues updated.`,
      );
    }
  }
  function archiveSelected(archived: boolean) {
    if (editing || selectedVisible.length === 0 || (archived && selectedVisible.some((issue) => issue.status !== 'Done'))) return;
    const next = issues.map((issue) => selected.includes(issue.id) && visible.includes(issue) && Boolean(issue.archived) !== archived
      ? { ...issue, archived, updatedAt: new Date().toISOString() } : issue);
    if (next.every((issue, index) => issue === issues[index])) {
      announce('Selected archive state already matches.');
    } else if (setIssues(next)) {
      setUndo(issues);
      announce(archived ? 'Selected issues archived.' : 'Selected issues restored.');
    }
  }
  const selectedVisible = visible.filter((issue) =>
    selected.includes(issue.id),
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [backupText, setBackupText] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [pendingImport, setPendingImport] = useState<Issue[] | null>(null);

  const importNewCount =
    pendingImport?.filter(
      (incoming) => !issues.some((issue) => issue.id === incoming.id),
    ).length ?? 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Enter an issue title.');
      return;
    }
    if (!editing && issues.length >= 500) {
      setError(
        'This list is limited to 500 issues. Export a backup and remove finished work.',
      );
      return;
    }
    let parsedTags: string[];
    try {
      parsedTags = normalizeTags(tags.split(','));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid tags.');
      return;
    }
    if (editing) {
      if (
        !setIssues(
          issues.map((issue) =>
            issue.id === editing
              ? {
                  ...issue,
                  tags: parsedTags,
                  title: title.trim(),
                  notes: notes.trim(),
                  priority,
                  updatedAt: new Date().toISOString(),
                }
              : issue,
          ),
        )
      )
        return;
    } else if (
      !setIssues([
        ...issues,
        {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          tags: parsedTags,
          title: title.trim(),
          notes: notes.trim(),
          status: 'Open',
          updatedAt: new Date().toISOString(),
          priority,
        },
      ])
    )
      return;
    announce(editing ? 'Issue updated.' : 'Issue added.');
    titleInput.current?.focus();
    setEditing(null);
    setTitle('');
    setTags('');
    setNotes('');
    setPriority('Normal');
    setError('');
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-700">
          Personal workspace
        </p>
        <h1 className="mt-2 text-4xl font-bold">Issue Desk</h1>
        <p className="mt-3 text-slate-600">Keep the next fix in sight.</p>
      </header>
      <section
        aria-label="Issue summary"
        className="mb-5 grid grid-cols-2 gap-3 rounded bg-white p-4 sm:grid-cols-5"
      >
        <p>Unfinished high priority: {counts.attention}</p>
        <p>Total: {counts.total}</p>
        {(['Open', 'In progress', 'Done'] as const).map((status) => (
          <button
            type="button"
            key={status}
            onClick={() => {
              setQuery('');
              setPriorityFilter('All');
              setFilter(status);
            }}
          >
            {status}: {counts[status]}
          </button>
        ))}
      </section>
      <div className="mb-5 grid items-start gap-3 sm:grid-cols-2">
        <details className="rounded bg-white p-4">
          <summary className="font-semibold">Reusable views</summary>
          <SavedViews
            query={{
              scope,
    tag: tagFilter,
    text: query,
              status: filter,
              priority: priorityFilter,
              order,
            }}
            onApply={(view) => {
              setScope(view.scope ?? 'Active');
              setTagFilter(view.tag ?? '');
              setQuery(view.text);
              setFilter(view.status);
              setPriorityFilter(view.priority);
              setOrder(view.order);
            }}
          />
        </details>
        <details className="rounded bg-white p-4">
          <summary className="font-semibold">Backups</summary>
          <div className="mb-5">
            <button
              type="button"
              disabled={Boolean(initial.error)}
              onClick={() => {
                try {
                  downloadBackup(issues);
                  setExportMessage(
                    'Backup download requested. Check your browser downloads.',
                  );
                } catch {
                  setExportMessage(
                    'Backup download could not start. Check browser download permissions and try again. Your issues are unchanged.',
                  );
                }
              }}
            >
              Export backup
            </button>
            <button
              type="button"
              disabled={Boolean(initial.error) || visible.length === 0}
              onClick={() => {
                try {
                  downloadBackup(visible, 'visible');
                  setExportMessage(
                    `Requested backup of ${visible.length} visible issues.`,
                  );
                } catch {
                  setExportMessage(
                    'Filtered backup could not start. Your issues are unchanged.',
                  );
                }
              }}
            >
              Export visible issues
            </button>
            <p role="status" className="mt-2 text-sm">
              {exportMessage}
            </p>
          </div>
          <details className="mb-5 rounded bg-white p-4">
            <summary>Restore a backup</summary>
            <label>
              Backup JSON
              <textarea
                ref={backupInput}
                value={backupText}
                onChange={(event) => {
                  setBackupText(event.target.value);
                  setPendingImport(null);
                }}
                rows={4}
                maxLength={5000000}
              />
            </label>
            <p className="my-2 text-sm">
              Only new issue IDs are added. Existing issues are never replaced.
              Maximum 500 issues and five million backup characters.
            </p>
            <button
              type="button"
              disabled={Boolean(initial.error)}
              onClick={() => {
                try {
                  setPendingImport(parseBackup(backupText));
                  setImportMessage(
                    'Backup validated. Review before importing.',
                  );
                } catch {
                  setPendingImport(null);
                  setImportMessage(
                    'Backup is invalid or exceeds the list limit. Nothing was changed.',
                  );
                }
              }}
            >
              Preview backup
            </button>
            {pendingImport && (
              <div className="space-y-2 rounded border p-3">
                <p>
                  Backup contains {pendingImport.length} issues:{' '}
                  {importNewCount} new, {pendingImport.length - importNewCount}{' '}
                  existing IDs to skip. Counts reflect the current list.
                </p>
                <button
                  type="button"
                  disabled={issues.length + importNewCount > 500}
                  onClick={() => {
                    try {
                      const next = mergeBackup(issues, pendingImport);
                      if (!setIssues(next)) return;
                      setImportMessage(
                        `Added ${next.length - issues.length} issues; skipped ${
                          pendingImport.length - (next.length - issues.length)
                        } existing IDs.`,
                      );
                      setPendingImport(null);
                      setBackupText('');
                      backupInput.current?.focus();
                    } catch {
                      setImportMessage(
                        'Backup exceeds the combined list limit. Nothing was changed.',
                      );
                    }
                  }}
                >
                  Import new issues
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingImport(null);
                    setImportMessage('Import cancelled. Nothing was changed.');
                    backupInput.current?.focus();
                  }}
                >
                  Cancel import
                </button>
              </div>
            )}
            <p role="status">{importMessage}</p>
          </details>
        </details>
      </div>
      {storageError && (
        <p role="alert" className="mb-4 rounded bg-red-100 p-4 text-red-900">
          {storageError}
        </p>
      )}
      <fieldset
        disabled={Boolean(initial.error)}
        className="grid items-start gap-6 md:grid-cols-[280px_1fr]"
      >
        <form
          onSubmit={submit}
          className="min-w-0 space-y-4 rounded-xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-semibold">
            {editing ? 'Edit issue' : 'New issue'}
          </h2>
          <label>
            Title
            <input
              aria-keyshortcuts="Alt+N"
              ref={titleInput}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              required
            />
          </label>
          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={1000}
              rows={4}
            />
          </label>
          <label>
            Tags (comma separated)
            <input value={tags} maxLength={128} onChange={(event) => setTags(event.target.value)} />
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as Issue['priority'])
              }
            >
              <option>Low</option>
              <option>Normal</option>
              <option>High</option>
            </select>
          </label>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          <button type="submit">
            {editing ? 'Save changes' : 'Add issue'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setTitle('');
    setTags('');
                setNotes('');
                setPriority('Normal');
                setError('');
              }}
            >
              Cancel editing
            </button>
          )}
        </form>
        <section className="min-w-0 space-y-4" aria-label="Issues">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              Search issues
              <input
                aria-keyshortcuts="Alt+F"
                ref={searchInput}
                maxLength={200}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              Issue scope
              <select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}>
                <option>Active</option><option>Archived</option><option>All</option>
              </select>
            </label>
            <label>
              Filter tag
              <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
                <option value="">All tags</option>
                {[...new Set([...issues.flatMap((issue) => issue.tags ?? []), ...(tagFilter ? [tagFilter] : [])])].sort().map((tag) => <option key={tag} value={tag}>{tag} ({issues.filter((issue) => (issue.tags ?? []).includes(tag)).length})</option>)}
              </select>
            </label>
            <label>
              Filter status
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option>All</option>
                <option>Open</option>
                <option>In progress</option>
                <option>Done</option>
              </select>
            </label>
            <label>
              Sort issues
              <select
                value={order}
                onChange={(event) => setOrder(event.target.value)}
              >
                <option>Added</option>
                <option>Priority</option>
                <option>Title</option>
              </select>
            </label>
            <label>
              Filter priority
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                <option>All</option>
                <option>Low</option>
                <option>Normal</option>
                <option>High</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFilter('All');
              setPriorityFilter('All');
              setOrder('Added');
              setScope('Active');
              setTagFilter('');
            }}
          >
            Reset filters
          </button>
          <p className="text-sm text-slate-600" aria-live="polite">
            {visible.length} of {issues.length} issues
          </p>
          <button
            type="button"
            disabled={visible.length === 0}
            onClick={() => setSelected(visible.map((issue) => issue.id))}
          >
            Select visible issues
          </button>
          <details
            open={selectedVisible.length > 0 || Boolean(undo)}
            className="space-y-3 rounded border border-slate-300 p-3"
          >
            <summary className="font-semibold">Batch tools</summary>
            <p className="text-sm text-slate-600">
              Batch changes affect {selectedVisible.length} visible selected
              issues. Status target: {batchStatus}; priority target:{' '}
              {batchPriority}.
            </p>
            <button type="button" disabled={!selectedVisible.length || Boolean(editing) || selectedVisible.some((issue) => issue.status !== 'Done')} onClick={() => archiveSelected(true)}>Archive selected</button>
            <label>
              Batch tag
              <input value={batchTag} maxLength={24} onChange={(event) => setBatchTag(event.target.value)} />
            </label>
            <button type="button" disabled={selectedVisible.length === 0 || Boolean(editing) || selectedVisible.some((issue) => issue.archived)} onClick={() => applyTag()}>Add tag to selected</button>
            <button type="button" disabled={selectedVisible.length === 0 || Boolean(editing) || selectedVisible.some((issue) => issue.archived)} onClick={() => applyTag(true)}>Remove tag from selected</button>
            <label>
              Batch status
              <select
                value={batchStatus}
                onChange={(event) =>
                  setBatchStatus(event.target.value as Issue['status'])
                }
              >
                <option>Open</option>
                <option>In progress</option>
                <option>Done</option>
              </select>
            </label>
            <button
              type="button"
              disabled={selectedVisible.length === 0 || Boolean(editing) || selectedVisible.some((issue) => issue.archived)}
              onClick={() => applyBatch({ status: batchStatus })}
            >
              Apply status
            </button>
            <label>
              Batch priority
              <select
                value={batchPriority}
                onChange={(event) =>
                  setBatchPriority(event.target.value as Issue['priority'])
                }
              >
                <option>Low</option>
                <option>Normal</option>
                <option>High</option>
              </select>
            </label>
            <button
              type="button"
              disabled={selectedVisible.length === 0 || Boolean(editing) || selectedVisible.some((issue) => issue.archived)}
              onClick={() => applyBatch({ priority: batchPriority })}
            >
              Apply priority
            </button>
            <button
              type="button"
              disabled={!undo || Boolean(editing)}
              onClick={() => {
                if (undo && setIssues(undo)) {
                  setSelected([]);
                  announce('Last batch change undone.');
                }
              }}
            >
              Undo last batch
            </button>
          </details>
          <p role="status">{selectedVisible.length} selected</p>
          <button
            type="button"
            disabled={selectedVisible.length === 0}
            onClick={() => setSelected([])}
          >
            Clear selection
          </button>
          {issues.length > 0 && visible.length === 0 && (
            <p>No issues match your filters.</p>
          )}
          {issues.length === 0 && (
            <p className="rounded-xl bg-white p-6">
              No issues yet. Add your first task to get started.
            </p>
          )}
          {visible.map((issue) => (
            <article
              key={issue.id}
              className="min-w-0 space-y-3 rounded-xl bg-white p-6 shadow-sm"
            >
              <p className="text-xs text-slate-600">
                {issue.updatedAt
                  ? `Updated ${new Date(issue.updatedAt).toLocaleString()}`
                  : 'Imported from an earlier list'}
              </p>
              <p className="text-sm text-indigo-700">
                {issue.priority} priority
              </p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  aria-label={'Select ' + issue.title}
                  checked={selected.includes(issue.id)}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? [...selected, issue.id]
                        : selected.filter((id) => id !== issue.id),
                    )
                  }
                />
                Select issue
              </label>
              <ul aria-label={'Tags for ' + issue.title} className="flex flex-wrap gap-1">
                {(issue.tags ?? []).map((tag) => <li key={tag} className="break-all rounded bg-indigo-50 px-2 py-1 text-xs">{tag}</li>)}
              </ul>
              <h2 className="break-words text-xl font-semibold">
                {issue.title}
              </h2>
              <p className="whitespace-pre-wrap break-words text-slate-600">
                {issue.notes}
              </p>
              <label className="break-words">
                Status
                <select
                  aria-label={'Status for ' + issue.title}
                  disabled={Boolean(issue.archived)}
                  value={issue.status}
                  onChange={(event) =>
                    setIssues(
                      issues.map((item) =>
                        item.id === issue.id
                          ? {
                              ...item,
                              status: event.target.value as Issue['status'],
                              updatedAt: new Date().toISOString(),
                            }
                          : item,
                      ),
                    )
                  }
                >
                  <option>Open</option>
                  <option>In progress</option>
                  <option>Done</option>
                </select>
              </label>
              <button
                type="button"
                disabled={Boolean(issue.archived)}
                aria-label={'Edit ' + issue.title}
                className="mr-2"
                onClick={() => {
                  titleInput.current?.focus();
                  setEditing(issue.id);
                  setTitle(issue.title);
                  setTags((issue.tags ?? []).join(', '));
                  setNotes(issue.notes);
                  setPriority(issue.priority);
                  setError('');
                }}
              >
                Edit
              </button>
              {issue.archived ? <div>
                <p>Archived · Restore this issue before editing.</p>
                <button type="button" disabled={Boolean(editing)} aria-label={'Restore ' + issue.title} onClick={() => {
                  if (setIssues(issues.map((item) => item.id === issue.id ? { ...item, archived: false, updatedAt: new Date().toISOString() } : item))) announce('Issue restored.');
                }}>Restore issue</button>
              </div> : (
                <button type="button" disabled={issue.status !== 'Done' || Boolean(editing)} onClick={() => {
                  if (setIssues(issues.map((item) => item.id === issue.id ? { ...item, archived: true, updatedAt: new Date().toISOString() } : item))) announce('Issue archived.');
                }} aria-label={'Archive ' + issue.title}>Archive issue</button>
              )}
              <button
                type="button"
                aria-label={'Delete ' + issue.title}
                className="bg-red-700 hover:bg-red-800"
                onClick={() => {
                  if (!window.confirm('Delete this issue?')) return;
                  if (!setIssues(issues.filter((item) => item.id !== issue.id)))
                    return;
                  titleInput.current?.focus();
                  announce('Issue deleted.');
                  if (editing === issue.id) {
                    setEditing(null);
                    setTitle('');
    setTags('');
                    setNotes('');
                    setPriority('Normal');
                    setError('');
                  }
                }}
              >
                Delete
              </button>
            </article>
          ))}
        </section>
      </fieldset>
      <details className="mb-5 rounded bg-white p-4">
        <summary>Keyboard help</summary>
        <p>
          Alt+N focuses the issue title. Alt+F focuses search. Tab moves between
          controls; Space selects checkboxes. Browser or system shortcuts may
          take precedence.
        </p>
      </details>
    </main>
  );
}
