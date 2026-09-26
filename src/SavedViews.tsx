import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
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
  function queryIdentity(value: Query) {
    return JSON.stringify([value.text, value.status, value.priority, value.order, value.tag ?? '', value.scope ?? 'Active', value.group ?? 'None']);
  }
  const changed = active && queryIdentity(active.query) !== queryIdentity(query);
  return (
    <section className="space-y-4" aria-label="Saved views">
      <h2 className="sr-only">Saved views</h2>
      <fieldset
        disabled={Boolean(initial.error)}
        className="min-w-0 space-y-4 disabled:opacity-90"
      >
        <div className="relative">
          <Label>
            Choose saved view
            <NativeSelect
              value={selected}
              onChange={(event) => {
                const view = views.find(
                  (item) => item.id === event.target.value,
                );
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
            </NativeSelect>
          </Label>
          <p
            aria-hidden="true"
            className="absolute right-0 top-0 text-xs leading-none tabular-nums text-muted-foreground"
          >
            {views.length} / 12
          </p>
        </div>

        <div className="space-y-2">
          <Label>
            View name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
            />
          </Label>
          <Button
            variant="blaze"
            size="sm"
            className="w-full"
            onClick={() => {
              if (!name.trim()) {
                setMessage('Enter a view name.');
                return;
              }
              const view = {
                id:
                  Date.now().toString(36) + Math.random().toString(36).slice(2),
                name: name.trim(),
                query,
              };
              if (save([...views, view])) setName('');
            }}
          >
            <Plus aria-hidden="true" />
            Save new view
          </Button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-1.5 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            disabled={!active || views.length >= 12}
            onClick={() => {
              if (active) save([...views, copyView(active, views)]);
            }}
          >
            <Copy aria-hidden="true" />
            Duplicate selected view
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            disabled={!selected || !changed}
            onClick={() =>
              save(
                views.map((view) =>
                  view.id === selected ? { ...view, query } : view,
                ),
              )
            }
          >
            <RefreshCw aria-hidden="true" />
            Update selected view
          </Button>
          {([-1, 1] as const).map((direction) => {
            const index = views.findIndex((view) => view.id === selected);
            return (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                key={direction}
                disabled={
                  index < 0 ||
                  index + direction < 0 ||
                  index + direction >= views.length
                }
                onClick={() => {
                  const next = [...views];
                  [next[index], next[index + direction]] = [
                    next[index + direction],
                    next[index],
                  ];
                  save(next);
                }}
              >
                {direction === -1 ? (
                  <ArrowUp aria-hidden="true" />
                ) : (
                  <ArrowDown aria-hidden="true" />
                )}
                Move view {direction === -1 ? 'up' : 'down'}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            disabled={!selected}
            onClick={() => {
              if (!name.trim()) {
                setMessage('Enter the new view name.');
                return;
              }
              if (
                save(
                  views.map((view) =>
                    view.id === selected
                      ? { ...view, name: name.trim() }
                      : view,
                  ),
                )
              )
                setName('');
            }}
          >
            <Pencil aria-hidden="true" />
            Rename selected view
          </Button>
          <Button
            variant="ghost-destructive"
            size="sm"
            className="justify-start"
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
            <Trash2 aria-hidden="true" />
            Delete selected view
          </Button>
        </div>

        <div className="space-y-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              try {
                downloadViews(views);
                setMessage(
                  `Views download requested. Action ${++saveNumber.current}.`,
                );
              } catch {
                setMessage(
                  `Views download failed. Action ${++saveNumber.current}.`,
                );
              }
            }}
          >
            <Download aria-hidden="true" />
            Export views
          </Button>
          <details className="group/import rounded-md border border-dashed bg-muted/40">
            <summary className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground">
              <Upload aria-hidden="true" className="size-3.5 shrink-0" />
              Import saved views
            </summary>
            <div className="space-y-2 border-t border-dashed px-3 pb-3 pt-3">
              <Label>
                Views backup JSON
                <Textarea
                  className="min-h-[96px] font-mono text-xs"
                  value={backupText}
                  maxLength={100000}
                  onChange={(event) => {
                    setBackupText(event.target.value);
                    setIncoming(null);
                  }}
                />
              </Label>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  try {
                    const parsed = parseViewBackup(backupText);
                    mergeViews(views, parsed);
                    setIncoming(parsed);
                    setMessage(
                      `Preview: add ${parsed.length} views. Conflicting names and IDs receive new names. Existing views stay unchanged.`,
                    );
                  } catch (error) {
                    setIncoming(null);
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : 'Invalid views backup.',
                    );
                  }
                }}
              >
                Preview views backup
              </Button>
              {incoming && (
                <div className="space-y-2 rounded-md border border-moss/20 bg-moss-soft p-2.5">
                  <p className="text-xs font-medium text-moss">
                    {incoming.length} views ready to add.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        try {
                          if (save(mergeViews(views, incoming))) {
                            setIncoming(null);
                            setBackupText('');
                          }
                        } catch (error) {
                          setMessage(
                            error instanceof Error
                              ? error.message
                              : 'Views could not be imported.',
                          );
                        }
                      }}
                    >
                      Import new views
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setIncoming(null);
                        setMessage('View import cancelled.');
                      }}
                    >
                      Cancel view import
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>
      </fieldset>
      {changed && (
        <p className="flex items-start gap-2 rounded-md border border-ochre/20 bg-ochre-soft px-3 py-2 text-xs font-medium text-ochre">
          <TriangleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          Current filters differ from the selected view.
        </p>
      )}
      <p role="status" className="min-h-4 text-xs text-muted-foreground">
        {message}
      </p>
    </section>
  );
}
