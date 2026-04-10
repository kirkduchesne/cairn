import { downloadViews, parseViewBackup, mergeViews } from './view-backup';
import { useRef, useState } from 'react';
import { Query } from './query';
import { copyView, loadViews, persistViews, SavedView } from './views';

export function SavedViews({
  query,
  onApply,
}: {
  query: Query;
  onApply: (query: Query) => void;
}) {
  const [initial] = useState(loadViews);
  const snapshot = useRef(initial.raw);
  const saveNumber = useRef(0);
  const [views, setViews] = useState(initial.views);
  const [backupText, setBackupText] = useState('');
  const [incoming, setIncoming] = useState<SavedView[] | null>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState(initial.error);
  function save(next: SavedView[]) {
    if (initial.error) return false;
    try {
      snapshot.current = persistViews(next, snapshot.current);
      setViews(next);
      saveNumber.current += 1;
      setMessage(`Views saved. Change ${saveNumber.current}.`);
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Views could not be saved.',
      );
      return false;
    }
  }
  const active = views.find((view) => view.id === selected);
  const changed =
    active && JSON.stringify(active.query) !== JSON.stringify(query);
  return (
    <section
      className="mb-5 space-y-3 rounded bg-white p-4"
      aria-label="Saved views"
    >
      <h2 className="font-semibold">Saved views</h2>
      <fieldset disabled={Boolean(initial.error)} className="space-y-3">
        <button type="button" onClick={() => {
          try { downloadViews(views); setMessage(`Views download requested. Action ${++saveNumber.current}.`); }
          catch { setMessage(`Views download failed. Action ${++saveNumber.current}.`); }
        }}>Export views</button>
        <details>
          <summary>Import saved views</summary>
          <label>Views backup JSON<textarea value={backupText} maxLength={100000} onChange={(event) => { setBackupText(event.target.value); setIncoming(null); }} /></label>
          <button type="button" onClick={() => {
            try {
              const parsed = parseViewBackup(backupText);
              mergeViews(views, parsed);
              setIncoming(parsed);
              setMessage(`Preview: add ${parsed.length} views. Conflicting names and IDs receive new names. Existing views stay unchanged.`);
            } catch (error) { setIncoming(null); setMessage(error instanceof Error ? error.message : 'Invalid views backup.'); }
          }}>Preview views backup</button>
          {incoming && <p>{incoming.length} views ready to add.</p>}
        </details>
        <label>
          Choose saved view
          <select
            value={selected}
            onChange={(event) => {
              const view = views.find((item) => item.id === event.target.value);
              if (view) {
                setSelected(view.id);
                onApply(view.query);
              }
            }}
          >
            <option value="" disabled>
              Choose a view
            </option>
            {views.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          View name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (!name.trim()) {
              setMessage('Enter a view name.');
              return;
            }
            const view = {
              id: Date.now().toString(36) + Math.random().toString(36).slice(2),
              name: name.trim(),
              query,
            };
            if (save([...views, view])) setName('');
          }}
        >
          Save new view
        </button>
        <button type="button" disabled={!active || views.length >= 12} onClick={() => {
          if (active) save([...views, copyView(active, views)]);
        }}>Duplicate selected view</button>
        {([-1, 1] as const).map((direction) => {
          const index = views.findIndex((view) => view.id === selected);
          return <button type="button" key={direction} disabled={index < 0 || index + direction < 0 || index + direction >= views.length} onClick={() => {
            const next = [...views];
            [next[index], next[index + direction]] = [next[index + direction], next[index]];
            save(next);
          }}>Move view {direction === -1 ? 'up' : 'down'}</button>;
        })}
        <button
          type="button"
          disabled={!selected}
          onClick={() => {
            if (!name.trim()) {
              setMessage('Enter the new view name.');
              return;
            }
            if (
              save(
                views.map((view) =>
                  view.id === selected ? { ...view, name: name.trim() } : view,
                ),
              )
            )
              setName('');
          }}
        >
          Rename selected view
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={() => {
            if (
              !window.confirm(
                'Delete this saved view? Issues will remain unchanged.',
              )
            )
              return;
            if (save(views.filter((view) => view.id !== selected)))
              setSelected('');
          }}
        >
          Delete selected view
        </button>
        <button
          type="button"
          disabled={!selected || !changed}
          onClick={() =>
            save(
              views.map((view) =>
                view.id === selected ? { ...view, query } : view,
              ),
            )
          }
        >
          Update selected view
        </button>
      </fieldset>
      {changed && <p>Current filters differ from the selected view.</p>}
      <p role="status">{message}</p>
    </section>
  );
}
