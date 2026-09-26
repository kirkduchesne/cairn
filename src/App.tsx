import { downloadText, resultSummary } from './text-export';
import { normalizeTags, tagSelected } from './tags';
import { Fragment, FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Bookmark,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Clock,
  Download,
  FileDown,
  FileText,
  Flame,
  Hash,
  HardDriveDownload,
  Keyboard,
  Layers,
  ListChecks,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  TriangleAlert,
  Undo2,
  Upload,
  X,
} from 'lucide-react';

import { downloadBackup, parseBackup, mergeBackup } from './backup';
import { shortcutTarget } from './shortcuts';
import { summarize } from './summary';
import { changeSelected } from './batch';
import { SavedViews } from './SavedViews';
import { queryIssues, groupIssues } from './query';
import { Issue, loadIssues, storageKey } from './storage';
import { brandName, CairnMark, Wordmark } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert } from '@/components/ui/alert';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Disclosure } from '@/components/ui/disclosure';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const priorityStyle: Record<
  Issue['priority'],
  { badge: BadgeProps['variant']; bar: string; icon: ReactNode }
> = {
  High: { badge: 'blaze', bar: 'bg-blaze', icon: <Flame aria-hidden="true" /> },
  Normal: {
    badge: 'secondary',
    bar: 'bg-muted-foreground/35',
    icon: <Minus aria-hidden="true" />,
  },
  Low: { badge: 'dusk', bar: 'bg-dusk/45', icon: <ArrowDown aria-hidden="true" /> },
};

const statusStyle: Record<Issue['status'], { dot: string; icon: ReactNode }> = {
  Open: { dot: 'bg-dusk', icon: <CircleDot /> },
  'In progress': { dot: 'bg-ochre', icon: <CircleDashed /> },
  Done: { dot: 'bg-moss', icon: <CircleCheck /> },
};

const statusTone: Record<Issue['status'], string> = {
  Open: 'text-dusk bg-dusk-soft',
  'In progress': 'text-ochre bg-ochre-soft',
  Done: 'text-moss bg-moss-soft',
};

function StatTile({
  label,
  value,
  icon,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="flex w-full items-start justify-between gap-2 text-xs font-medium leading-snug text-muted-foreground">
        {label}
        <span className="sr-only">: </span>
        <span
          aria-hidden="true"
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-md [&_svg]:size-4',
            tone,
          )}
        >
          {icon}
        </span>
      </span>
      <span className="font-display text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </span>
    </>
  );
  const className =
    'flex min-w-0 flex-col items-start justify-between gap-3 rounded-xl border bg-card/80 p-4 text-left shadow-sm backdrop-blur-sm';
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        className,
        'transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      {body}
    </button>
  ) : (
    <p className={className}>{body}</p>
  );
}
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
  const counts = summarize(issues.filter((issue) => !issue.archived));
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
      const next = tagSelected(
        issues,
        selectedVisible.map((issue) => issue.id),
        batchTag,
        remove,
      );
      if (next.every((issue, index) => issue === issues[index])) {
        announce('Selected tags already match.');
      } else if (setIssues(next)) {
        setUndo(issues);
        announce('Selected issue tags updated.');
      }
    } catch (error) {
      announce(
        error instanceof Error ? error.message : 'Tags could not be changed.',
      );
    }
  }
  const [tags, setTags] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Issue['priority']>('Normal');
  const [group, setGroup] = useState<'None' | 'Status' | 'Priority'>('None');
  const [scope, setScope] = useState<'Active' | 'Archived' | 'All'>('Active');
  const [tagFilter, setTagFilter] = useState('');
  const [filter, setFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState('Added');
  const visible = queryIssues(issues, {
    group,
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
    if (
      editing ||
      selectedVisible.length === 0 ||
      (archived && selectedVisible.some((issue) => issue.status !== 'Done'))
    )
      return;
    const next = issues.map((issue) =>
      selected.includes(issue.id) &&
      visible.includes(issue) &&
      Boolean(issue.archived) !== archived
        ? { ...issue, archived, updatedAt: new Date().toISOString() }
        : issue,
    );
    if (next.every((issue, index) => issue === issues[index])) {
      announce('Selected archive state already matches.');
    } else if (setIssues(next)) {
      setUndo(issues);
      announce(
        archived ? 'Selected issues archived.' : 'Selected issues restored.',
      );
    }
  }
  const selectedVisible = visible.filter((issue) =>
    selected.includes(issue.id),
  );
  const [editing, setEditing] = useState<string | null>(null);
  const original = issues.find((issue) => issue.id === editing);
  const editorDirty = original
    ? title !== original.title ||
      notes !== original.notes ||
      priority !== original.priority ||
      tags !== (original.tags ?? []).join(', ')
    : Boolean(title || notes || tags || priority !== 'Normal');
  useEffect(() => {
    if (!editorDirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [editorDirty]);
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


  const archivedCount = issues.filter((issue) => issue.archived).length;
  const batchLocked =
    selectedVisible.length === 0 ||
    Boolean(editing) ||
    selectedVisible.some((issue) => issue.archived);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Wordmark />
          <span className="hidden border-l pl-4 text-xs text-muted-foreground sm:inline">
            Local-first backlog
          </span>
          <div className="ml-auto flex items-center gap-3">
            <p
              aria-hidden="true"
              className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex"
            >
              <Kbd>Alt</Kbd>
              <Kbd>N</Kbd>
              <span className="mr-2">New</span>
              <Kbd>Alt</Kbd>
              <Kbd>F</Kbd>
              <span>Search</span>
            </p>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <p role="status" className="sr-only">
          {announcement}
        </p>
        <section className="relative overflow-hidden rounded-2xl border bg-card bg-contours px-5 py-7 sm:px-8 sm:py-9">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blaze">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-blaze" />
            Personal workspace
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-[2.1rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Keep the next fix in sight.
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
            {brandName} stacks your backlog into clear trail markers. Tag it,
            group it, archive what&rsquo;s done, and carry your views
            anywhere&thinsp;&mdash;&thinsp;all stored in this browser.
          </p>
          <section
            aria-label="Issue summary"
            className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            <StatTile
              label="Unfinished high priority"
              value={counts.attention}
              icon={<Flame />}
              tone={
                counts.attention
                  ? 'bg-blaze text-blaze-foreground'
                  : 'bg-muted text-muted-foreground'
              }
            />
            <StatTile
              label="Active total"
              value={counts.total}
              icon={<Layers />}
              tone="bg-primary text-primary-foreground"
            />
            <StatTile
              label="Archived"
              value={archivedCount}
              icon={<Archive />}
              tone="bg-muted text-muted-foreground"
              onClick={() => {
                setScope('Archived');
                setFilter('All');
                setPriorityFilter('All');
                setTagFilter('');
                setQuery('');
              }}
            />
            {(['Open', 'In progress', 'Done'] as const).map((status) => (
              <StatTile
                key={status}
                label={status}
                value={counts[status]}
                icon={statusStyle[status].icon}
                tone={statusTone[status]}
                onClick={() => {
                  setScope('Active');
                  setTagFilter('');
                  setQuery('');
                  setPriorityFilter('All');
                  setFilter(status);
                }}
              />
            ))}
          </section>
        </section>
        {(storageError || initial.error) && (
          <div className="mt-6 space-y-3">
            {storageError && (
              <Alert role="alert" variant="destructive">
                <TriangleAlert aria-hidden="true" />
                <p>{storageError}</p>
              </Alert>
            )}
            {initial.error && (
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    const raw = localStorage.getItem(storageKey);
                    if (raw === null) {
                      announce('No stored issue text is available to recover.');
                      return;
                    }
                    downloadText(raw, 'cairn-storage-recovery.txt');
                    announce(
                      'Raw storage download requested. Keep it for manual recovery; it may not be a valid backup.',
                    );
                  } catch {
                    announce(
                      'Storage recovery could not be downloaded. Existing storage is unchanged.',
                    );
                  }
                }}
              >
                <Download aria-hidden="true" />
                Download unreadable storage
              </Button>
            )}
          </div>
        )}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:gap-8">
          <aside className="min-w-0 space-y-4" aria-label="Workspace tools">
            <fieldset disabled={Boolean(initial.error)} className="min-w-0">
              <form
                onSubmit={submit}
                className={cn(
                  'min-w-0 space-y-4 rounded-xl border bg-card p-5 shadow-[0_1px_2px_hsl(24_20%_20%/0.04),0_8px_24px_-12px_hsl(24_20%_20%/0.12)] transition-shadow',
                  editing && 'border-ochre/40 ring-4 ring-ochre/10',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    {editing ? 'Edit issue' : 'New issue'}
                  </h2>
                  {editing ? (
                    <Badge variant="ochre">
                      <Pencil aria-hidden="true" />
                      Editing
                    </Badge>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="hidden items-center gap-1 sm:flex"
                    >
                      <Kbd>Alt</Kbd>
                      <Kbd>N</Kbd>
                    </span>
                  )}
                </div>
                <Label>
                  Title
                  <Input
                    aria-keyshortcuts="Alt+N"
                    ref={titleInput}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={100}
                    placeholder="What needs fixing?"
                    required
                  />
                </Label>
                <Label>
                  Notes
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={1000}
                    placeholder="Context, repro steps, links…"
                    rows={4}
                  />
                </Label>
                <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
                  <Label>
                    Tags (comma separated)
                    <Input
                      value={tags}
                      maxLength={128}
                      placeholder="ui, docs"
                      onChange={(event) => setTags(event.target.value)}
                    />
                  </Label>
                  <Label>
                    Priority
                    <NativeSelect
                      value={priority}
                      onChange={(event) =>
                        setPriority(event.target.value as Issue['priority'])
                      }
                    >
                      <option>Low</option>
                      <option>Normal</option>
                      <option>High</option>
                    </NativeSelect>
                  </Label>
                </div>
                {error && (
                  <Alert role="alert" variant="destructive" className="py-2">
                    <TriangleAlert aria-hidden="true" />
                    <p>{error}</p>
                  </Alert>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="submit" variant="blaze" className="flex-1">
                    {editing ? (
                      <Save aria-hidden="true" />
                    ) : (
                      <Plus aria-hidden="true" />
                    )}
                    {editing ? 'Save changes' : 'Add issue'}
                  </Button>
                  {(editing || title || notes || tags || priority !== 'Normal') && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        titleInput.current?.focus();
                        announce('Issue editor cleared.');
                        setEditing(null);
                        setTitle('');
                        setTags('');
                        setNotes('');
                        setPriority('Normal');
                        setError('');
                      }}
                    >
                      <X aria-hidden="true" />
                      {editing ? 'Cancel editing' : 'Clear new issue'}
                    </Button>
                  )}
                </div>
              </form>
            </fieldset>
            <Disclosure summary="Reusable views" icon={<Bookmark />}>
              <SavedViews
                query={{
                  group,
                  scope,
                  tag: tagFilter,
                  text: query,
                  status: filter,
                  priority: priorityFilter,
                  order,
                }}
                onApply={(view) => {
                  setGroup(view.group ?? 'None');
                  setScope(view.scope ?? 'Active');
                  setTagFilter(view.tag ?? '');
                  setQuery(view.text);
                  setFilter(view.status);
                  setPriorityFilter(view.priority);
                  setOrder(view.order);
                }}
              />
            </Disclosure>
            <Disclosure summary="Backups" icon={<HardDriveDownload />}>
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
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
                  <Download aria-hidden="true" />
                  Export backup
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
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
                  <FileDown aria-hidden="true" />
                  Export visible issues
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  disabled={Boolean(initial.error)}
                  onClick={() => {
                    try {
                      downloadText(
                        resultSummary(visible, {
                          text: query,
                          status: filter,
                          priority: priorityFilter,
                          tag: tagFilter,
                          order,
                          scope,
                        }),
                        'cairn-summary.txt',
                      );
                      announce('Result summary download requested.');
                    } catch {
                      announce(
                        'Summary download could not start. Your issues are unchanged.',
                      );
                    }
                  }}
                >
                  <FileText aria-hidden="true" />
                  Export result summary
                </Button>
                <p
                  role="status"
                  className="text-xs text-muted-foreground empty:hidden"
                >
                  {exportMessage}
                </p>
              </div>
              <Disclosure
                summary="Restore a backup"
                icon={<Upload />}
                className="mt-4 bg-muted/30 shadow-none"
              >
                <div className="space-y-3">
                  <Label>
                    Backup JSON
                    <Textarea
                      ref={backupInput}
                      className="font-mono text-xs"
                      value={backupText}
                      onChange={(event) => {
                        setBackupText(event.target.value);
                        setPendingImport(null);
                      }}
                      rows={4}
                      maxLength={5000000}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only new issue IDs are added. Existing issues are never
                    replaced. Maximum 500 issues and five million backup
                    characters.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
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
                    <Search aria-hidden="true" />
                    Preview backup
                  </Button>
                  {pendingImport && (
                    <div className="space-y-3 rounded-lg border border-moss/25 bg-moss-soft p-3 text-sm">
                      <p>
                        Backup contains {pendingImport.length} issues:{' '}
                        {importNewCount} new,{' '}
                        {pendingImport.length - importNewCount} existing IDs to
                        skip. Counts reflect the current list.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={issues.length + importNewCount > 500}
                          onClick={() => {
                            try {
                              const next = mergeBackup(issues, pendingImport);
                              if (!setIssues(next)) return;
                              setImportMessage(
                                `Added ${next.length - issues.length} issues; skipped ${
                                  pendingImport.length -
                                  (next.length - issues.length)
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
                          <Upload aria-hidden="true" />
                          Import new issues
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPendingImport(null);
                            setImportMessage(
                              'Import cancelled. Nothing was changed.',
                            );
                            backupInput.current?.focus();
                          }}
                        >
                          Cancel import
                        </Button>
                      </div>
                    </div>
                  )}
                  <p
                    role="status"
                    className="text-xs text-muted-foreground empty:hidden"
                  >
                    {importMessage}
                  </p>
                </div>
              </Disclosure>
            </Disclosure>
            <Disclosure summary="Keyboard help" icon={<Keyboard />}>
              <dl className="mb-3 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
                <dt className="flex gap-1">
                  <Kbd>Alt</Kbd>
                  <Kbd>N</Kbd>
                </dt>
                <dd>Focus the issue title</dd>
                <dt className="flex gap-1">
                  <Kbd>Alt</Kbd>
                  <Kbd>F</Kbd>
                </dt>
                <dd>Focus search</dd>
              </dl>
              <p className="text-xs text-muted-foreground">
                Alt+N focuses the issue title. Alt+F focuses search. Tab moves
                between controls; Space selects checkboxes. Browser or system
                shortcuts may take precedence.
              </p>
            </Disclosure>
          </aside>
          <fieldset disabled={Boolean(initial.error)} className="min-w-0">
            <section className="min-w-0 space-y-4" aria-label="Issues">
              <Card className="space-y-4 p-4 sm:p-5">
                <div className="relative">
                  <Label>
                    Search issues
                    <span className="relative block">
                      <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        aria-keyshortcuts="Alt+F"
                        ref={searchInput}
                        maxLength={200}
                        value={query}
                        placeholder="Title, notes, or tags"
                        className="h-10 pl-9 pr-20 text-[15px]"
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </span>
                  </Label>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-2.5 right-3 hidden gap-1 sm:flex"
                  >
                    <Kbd>Alt</Kbd>
                    <Kbd>F</Kbd>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Label>
                    Group issues
                    <NativeSelect
                      value={group}
                      onChange={(event) =>
                        setGroup(event.target.value as typeof group)
                      }
                    >
                      <option>None</option>
                      <option>Status</option>
                      <option>Priority</option>
                    </NativeSelect>
                  </Label>
                  <Label>
                    Issue scope
                    <NativeSelect
                      value={scope}
                      onChange={(event) =>
                        setScope(event.target.value as typeof scope)
                      }
                    >
                      <option>Active</option>
                      <option>Archived</option>
                      <option>All</option>
                    </NativeSelect>
                  </Label>
                  <Label>
                    Filter tag
                    <NativeSelect
                      value={tagFilter}
                      onChange={(event) => setTagFilter(event.target.value)}
                    >
                      <option value="">All tags</option>
                      {[
                        ...new Set([
                          ...issues.flatMap((issue) => issue.tags ?? []),
                          ...(tagFilter ? [tagFilter] : []),
                        ]),
                      ]
                        .sort()
                        .map((tag) => (
                          <option key={tag} value={tag}>
                            {tag} (
                            {
                              issues.filter((issue) =>
                                (issue.tags ?? []).includes(tag),
                              ).length
                            }
                            )
                          </option>
                        ))}
                    </NativeSelect>
                  </Label>
                  <Label>
                    Filter status
                    <NativeSelect
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                    >
                      <option>All</option>
                      <option>Open</option>
                      <option>In progress</option>
                      <option>Done</option>
                    </NativeSelect>
                  </Label>
                  <Label>
                    Sort issues
                    <NativeSelect
                      value={order}
                      onChange={(event) => setOrder(event.target.value)}
                    >
                      <option>Added</option>
                      <option>Newest</option>
                      <option>Oldest</option>
                      <option>Priority</option>
                      <option>Title</option>
                    </NativeSelect>
                  </Label>
                  <Label>
                    Filter priority
                    <NativeSelect
                      value={priorityFilter}
                      onChange={(event) => setPriorityFilter(event.target.value)}
                    >
                      <option>All</option>
                      <option>Low</option>
                      <option>Normal</option>
                      <option>High</option>
                    </NativeSelect>
                  </Label>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3">
                  <p
                    className="flex min-w-0 flex-1 items-start gap-2 break-words text-xs text-muted-foreground"
                    aria-label="Current filters"
                  >
                    <SlidersHorizontal
                      aria-hidden="true"
                      className="mt-px size-3.5 shrink-0"
                    />
                    <span className="min-w-0">
                      {scope} issues · Status: {filter} · Priority:{' '}
                      {priorityFilter} · Tag: {tagFilter || 'All'} · Search:{' '}
                      {query || 'None'}
                    </span>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setFilter('All');
                      setPriorityFilter('All');
                      setOrder('Added');
                      setGroup('None');
                      setScope('Active');
                      setTagFilter('');
                    }}
                  >
                    <RotateCcw aria-hidden="true" />
                    Reset filters
                  </Button>
                </div>
              </Card>
              <div className="flex flex-wrap items-center gap-2 px-1">
                <p
                  className="mr-auto text-sm tabular-nums text-muted-foreground"
                  aria-live="polite"
                >
                  {visible.length} of {issues.length} issues
                </p>
                <p
                  role="status"
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums',
                    selectedVisible.length
                      ? 'bg-blaze-soft text-blaze'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {selectedVisible.length} selected
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={visible.length === 0}
                  onClick={() => setSelected(visible.map((issue) => issue.id))}
                >
                  <ListChecks aria-hidden="true" />
                  Select visible issues
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={selectedVisible.length === 0}
                  onClick={() => setSelected([])}
                >
                  <X aria-hidden="true" />
                  Clear selection
                </Button>
              </div>
              <Disclosure
                summary="Batch tools"
                icon={<Layers />}
                open={selectedVisible.length > 0 || Boolean(undo)}
                className={cn(
                  selectedVisible.length > 0 && 'border-blaze/35 ring-4 ring-blaze/10',
                )}
              >
                <div className="space-y-4">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Only completed issues can be archived. Archived issues
                      keep their notes and tags; restore them before changing
                      status, priority, or tags.
                    </p>
                    <p>
                      Batch changes affect {selectedVisible.length} visible
                      selected issues. Status target: {batchStatus}; priority
                      target: {batchPriority}.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                      <Label>
                        Batch tag
                        <Input
                          value={batchTag}
                          maxLength={24}
                          placeholder="tag"
                          onChange={(event) => setBatchTag(event.target.value)}
                        />
                      </Label>
                      <div className="grid gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={batchLocked}
                          onClick={() => applyTag()}
                        >
                          <Tag aria-hidden="true" />
                          Add tag to selected
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={batchLocked}
                          onClick={() => applyTag(true)}
                        >
                          <X aria-hidden="true" />
                          Remove tag from selected
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                      <Label>
                        Batch status
                        <NativeSelect
                          value={batchStatus}
                          onChange={(event) =>
                            setBatchStatus(event.target.value as Issue['status'])
                          }
                        >
                          <option>Open</option>
                          <option>In progress</option>
                          <option>Done</option>
                        </NativeSelect>
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={batchLocked}
                        onClick={() => applyBatch({ status: batchStatus })}
                      >
                        <CircleCheck aria-hidden="true" />
                        Apply status
                      </Button>
                    </div>
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                      <Label>
                        Batch priority
                        <NativeSelect
                          value={batchPriority}
                          onChange={(event) =>
                            setBatchPriority(
                              event.target.value as Issue['priority'],
                            )
                          }
                        >
                          <option>Low</option>
                          <option>Normal</option>
                          <option>High</option>
                        </NativeSelect>
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={batchLocked}
                        onClick={() => applyBatch({ priority: batchPriority })}
                      >
                        <ArrowUp aria-hidden="true" />
                        Apply priority
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    <Button
                      size="sm"
                      disabled={
                        !selectedVisible.length ||
                        Boolean(editing) ||
                        selectedVisible.some((issue) => issue.status !== 'Done')
                      }
                      onClick={() => archiveSelected(true)}
                    >
                      <Archive aria-hidden="true" />
                      Archive selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!selectedVisible.length || Boolean(editing)}
                      onClick={() => archiveSelected(false)}
                    >
                      <ArchiveRestore aria-hidden="true" />
                      Restore selected
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="sm:ml-auto"
                      disabled={!undo || Boolean(editing)}
                      onClick={() => {
                        if (undo && setIssues(undo)) {
                          setSelected([]);
                          announce('Last batch change undone.');
                        }
                      }}
                    >
                      <Undo2 aria-hidden="true" />
                      Undo last batch
                    </Button>
                  </div>
                </div>
              </Disclosure>
              {issues.length > 0 && visible.length === 0 && (
                <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center">
                  <Search
                    aria-hidden="true"
                    className="mb-3 size-6 text-muted-foreground"
                  />
                  <p className="font-medium">No issues match your filters.</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {scope === 'Archived'
                      ? 'Archived work appears here after completed issues are archived.'
                      : 'Clear your filters or check archived work to find another issue.'}
                  </p>
                </div>
              )}
              {issues.length === 0 && (
                <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center">
                  <CairnMark className="mb-4 size-12 opacity-90" />
                  <p className="max-w-xs text-muted-foreground">
                    No issues yet. Add your first task to get started.
                  </p>
                </div>
              )}
              {groupIssues(visible, group).map((section) => (
                <Fragment key={section.name}>
                  {section.name && (
                    <h2 className="flex items-center gap-2 px-1 pt-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'size-2 rounded-full',
                          section.name in statusStyle
                            ? statusStyle[section.name as Issue['status']].dot
                            : section.name in priorityStyle
                              ? priorityStyle[section.name as Issue['priority']].bar
                              : 'bg-muted-foreground',
                        )}
                      />
                      {section.name} ({section.issues.length})
                    </h2>
                  )}
                  {section.issues.map((issue) => {
                    const isSelected = selected.includes(issue.id);
                    return (
                      <article
                        key={issue.id}
                        className={cn(
                          'relative min-w-0 animate-rise-in overflow-hidden rounded-xl border bg-card p-4 pl-5 shadow-[0_1px_2px_hsl(24_20%_20%/0.04)] transition-[box-shadow,border-color] hover:shadow-[0_8px_24px_-12px_hsl(24_20%_20%/0.18)] sm:p-5 sm:pl-6',
                          issue.archived && 'bg-muted/40',
                          isSelected && 'border-blaze/45 ring-4 ring-blaze/10',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute inset-y-0 left-0 w-1',
                            priorityStyle[issue.priority].bar,
                          )}
                        />
                        <div className="flex items-start gap-3">
                          <label className="mt-1 flex">
                            <Checkbox
                              aria-label={'Select ' + issue.title}
                              checked={isSelected}
                              onChange={(event) =>
                                setSelected(
                                  event.target.checked
                                    ? [...selected, issue.id]
                                    : selected.filter((id) => id !== issue.id),
                                )
                              }
                            />
                            <span className="sr-only">Select issue</span>
                          </label>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge
                                as="p"
                                variant={priorityStyle[issue.priority].badge}
                              >
                                {priorityStyle[issue.priority].icon}
                                {issue.priority} priority
                              </Badge>
                              {issue.archived && (
                                <Badge variant="outline" className="text-muted-foreground">
                                  <Archive aria-hidden="true" />
                                  Archived
                                </Badge>
                              )}
                            </div>
                            <h2
                              className={cn(
                                'break-words text-base font-semibold leading-snug sm:text-lg',
                                issue.archived && 'text-muted-foreground',
                              )}
                            >
                              {issue.title}
                            </h2>
                            {issue.notes && (
                              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                                {issue.notes}
                              </p>
                            )}
                            <ul
                              aria-label={'Tags for ' + issue.title}
                              className="flex flex-wrap gap-1.5 empty:hidden"
                            >
                              {(issue.tags ?? []).map((tag) => (
                                <li
                                  key={tag}
                                  className="inline-flex min-w-0 items-center gap-0.5 break-all rounded-md border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] text-foreground/80"
                                >
                                  <Hash
                                    aria-hidden="true"
                                    className="size-3 shrink-0 text-muted-foreground"
                                  />
                                  {tag}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3">
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock aria-hidden="true" className="size-3.5" />
                            {issue.updatedAt ? (
                              <time dateTime={issue.updatedAt}>
                                Updated{' '}
                                {new Date(issue.updatedAt).toLocaleString()}
                              </time>
                            ) : (
                              <span>
                                Imported from an earlier list
                                <span className="sr-only">
                                  ; update time unknown
                                </span>
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
                            <label className="flex items-center gap-2 break-words text-xs font-medium text-muted-foreground">
                              Status
                              <span className="relative flex items-center">
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'pointer-events-none absolute left-2.5 z-10 size-2 rounded-full',
                                    statusStyle[issue.status].dot,
                                  )}
                                />
                                <NativeSelect
                                  aria-label={'Status for ' + issue.title}
                                  disabled={Boolean(issue.archived)}
                                  className="h-8 pl-6 text-xs font-medium text-foreground"
                                  value={issue.status}
                                  onChange={(event) =>
                                    setIssues(
                                      issues.map((item) =>
                                        item.id === issue.id
                                          ? {
                                              ...item,
                                              status: event.target
                                                .value as Issue['status'],
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
                                </NativeSelect>
                              </span>
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={Boolean(issue.archived)}
                              aria-label={'Edit ' + issue.title}
                              onClick={() => {
                                if (editing === issue.id) {
                                  titleInput.current?.focus();
                                  return;
                                }
                                if (
                                  editorDirty &&
                                  !window.confirm('Discard unfinished issue edits?')
                                )
                                  return;
                                titleInput.current?.focus();
                                setEditing(issue.id);
                                setTitle(issue.title);
                                setTags((issue.tags ?? []).join(', '));
                                setNotes(issue.notes);
                                setPriority(issue.priority);
                                setError('');
                              }}
                            >
                              <Pencil aria-hidden="true" />
                              Edit
                            </Button>
                            {issue.archived ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="sr-only">
                                  Archived · Restore this issue before editing.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={Boolean(editing)}
                                  aria-label={'Restore ' + issue.title}
                                  title="Restore this issue before editing"
                                  onClick={() => {
                                    if (
                                      setIssues(
                                        issues.map((item) =>
                                          item.id === issue.id
                                            ? {
                                                ...item,
                                                archived: false,
                                                updatedAt: new Date().toISOString(),
                                              }
                                            : item,
                                        ),
                                      )
                                    )
                                      announce('Issue restored.');
                                  }}
                                >
                                  <ArchiveRestore aria-hidden="true" />
                                  Restore issue
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={issue.status !== 'Done' || Boolean(editing)}
                                title={
                                  issue.status !== 'Done'
                                    ? 'Mark as Done to archive'
                                    : undefined
                                }
                                onClick={() => {
                                  if (
                                    setIssues(
                                      issues.map((item) =>
                                        item.id === issue.id
                                          ? {
                                              ...item,
                                              archived: true,
                                              updatedAt: new Date().toISOString(),
                                            }
                                          : item,
                                      ),
                                    )
                                  )
                                    announce('Issue archived.');
                                }}
                                aria-label={'Archive ' + issue.title}
                              >
                                <Archive aria-hidden="true" />
                                Archive issue
                              </Button>
                            )}
                            <Button
                              variant="ghost-destructive"
                              size="sm"
                              aria-label={'Delete ' + issue.title}
                              onClick={() => {
                                if (!window.confirm('Delete this issue?')) return;
                                if (
                                  !setIssues(
                                    issues.filter((item) => item.id !== issue.id),
                                  )
                                )
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
                              <Trash2 aria-hidden="true" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </Fragment>
              ))}
            </section>
          </fieldset>
        </div>
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <CairnMark className="size-5" />
          <span className="font-display text-sm font-semibold text-foreground">
            {brandName}
          </span>
          <span>Stored only in this browser. Keep backups.</span>
        </div>
      </footer>
    </div>
  );
}
