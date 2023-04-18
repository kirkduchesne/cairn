import { FormEvent, useState } from 'react';

type Issue = { id: string; title: string; notes: string; status: 'Open' | 'In progress' | 'Done' };

export function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) { setError('Enter an issue title.'); return; }
    if (editing) {
      setIssues(issues.map(issue => issue.id === editing ? { ...issue, title: title.trim(), notes: notes.trim() } : issue));
    } else setIssues([...issues, { id: Date.now().toString(36) + Math.random().toString(36).slice(2), title: title.trim(), notes: notes.trim(), status: 'Open' }]);
    setEditing(null);
    setTitle('');
    setNotes('');
    setError('');
  }

  return <main className="mx-auto max-w-4xl px-4 py-10">
    <header className="mb-8"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-700">Personal workspace</p><h1 className="mt-2 text-4xl font-bold">Issue Desk</h1><p className="mt-3 text-slate-600">Keep the next fix in sight.</p></header>
    <div className="grid items-start gap-6 md:grid-cols-[280px_1fr]">
      <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">{editing ? 'Edit issue' : 'New issue'}</h2>
        <label>Title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={100} required /></label>
        <label>Notes<textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={1000} rows={4} /></label>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <button type="submit">{editing ? 'Save changes' : 'Add issue'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setTitle(''); setNotes(''); setError(''); }}>Cancel editing</button>}
      </form>
      <section className="space-y-4" aria-label="Issues">
        {issues.length === 0 && <p className="rounded-xl bg-white p-6">No issues yet. Add your first task to get started.</p>}
        {issues.map(issue => <article key={issue.id} className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="break-words text-xl font-semibold">{issue.title}</h2><p className="whitespace-pre-wrap break-words text-slate-600">{issue.notes}</p>
          <label>Status for {issue.title}<select value={issue.status} onChange={event => setIssues(issues.map(item => item.id === issue.id ? { ...item, status: event.target.value as Issue['status'] } : item))}>
            <option>Open</option><option>In progress</option><option>Done</option>
          </select></label>
          <button type="button" onClick={() => { setEditing(issue.id); setTitle(issue.title); setNotes(issue.notes); setError(''); }}>Edit {issue.title}</button>
        </article>)}
      </section>
    </div>
  </main>;
}
