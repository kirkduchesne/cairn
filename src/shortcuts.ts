export function shortcutTarget(event: KeyboardEvent): 'title' | 'search' | null {
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing || event.repeat) return null;
  if (event.key.toLowerCase() === 'n') return 'title';
  if (event.key.toLowerCase() === 'f') return 'search';
  return null;
}
