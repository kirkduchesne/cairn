import { useRef, useState } from 'react';
import { Query } from './query';
import { loadViews, persistViews, SavedView } from './views';

export function SavedViews({ query, onApply }: { query: Query; onApply: (query: Query) => void }) {
  const [initial] = useState(loadViews);
  const snapshot = useRef(initial.raw);
  const [views, setViews] = useState(initial.views);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState(initial.error);
  function save(next: SavedView[]) {
    if (initial.error) return false;
    try {
      snapshot.current = persistViews(next, snapshot.current);
      setViews(next);
      setMessage('Views saved.');
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Views could not be saved.');
      return false;
    }
  }
  const active = views.find(view => view.id === selected);
  const changed = active && JSON.stringify(active.query) !== JSON.stringify(query);
  return <section className="mb-5 space-y-3 rounded bg-white p-4" aria-label="Saved views">
    <h2 className="font-semibold">Saved views</h2>
    <fieldset disabled={Boolean(initial.error)} className="space-y-3">
      <label>Choose saved view<select value={selected} onChange={event => {
        const view = views.find(item => item.id === event.target.value);
        if (view) { setSelected(view.id); onApply(view.query); }
      }}><option value="">Choose a view</option>{views.map(view => <option key={view.id} value={view.id}>{view.name}</option>)}</select></label>
      <label>View name<input value={name} onChange={event => setName(event.target.value)} maxLength={40} /></label>
      <button type="button" onClick={() => {
        if (!name.trim()) { setMessage('Enter a view name.'); return; }
        const view = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), name: name.trim(), query };
        if (save([...views, view])) setName('');
      }}>Save new view</button>
      <button type="button" disabled={!selected} onClick={() => {
        if (!name.trim()) { setMessage('Enter the new view name.'); return; }
        if (save(views.map(view => view.id === selected ? { ...view, name: name.trim() } : view))) setName('');
      }}>Rename selected view</button>
      <button type="button" disabled={!selected} onClick={() => {
        if (!window.confirm('Delete this saved view? Issues will remain unchanged.')) return;
        if (save(views.filter(view => view.id !== selected))) setSelected('');
      }}>Delete selected view</button>
    </fieldset>
    {changed && <p>Current filters differ from the selected view.</p>}
    <p role="status">{message}</p>
  </section>;
}
