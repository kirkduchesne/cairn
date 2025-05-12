# Issue Desk

A small browser-local issue tracker with priorities, sorting, and JSON backups.

Created in September 2026 as a reconstruction of incremental development using
technology available in 2023–2024. Historical author and committer dates were
intentionally assigned; they do not establish original publication in those years.

## Run

Use Node 20, then:

```sh
npm ci
npm run dev
npm test
npm run build
```

The development server binds to loopback. No account, API, or server database is
required. Keep one active tab and avoid storing sensitive information.

## Workflow and storage

Add a title (100 characters), notes (1,000 characters), and priority. Edit details,
change status, search, filter, sort, or delete with confirmation. Up to 500 issues
can be added. Existing larger legacy lists remain readable and exportable.

The original `issue-desk-v1` storage key is retained. Older records receive Normal
priority and an unknown update time; no historical timestamp is invented. Reading
does not rewrite storage. Changes persist only after a successful write. Invalid
storage disables changes and is never replaced automatically. If saved data has
changed in another tab, export this tab's list and reload before continuing.
The check prevents ordinary stale writes, but localStorage is not a transactional
multi-user database. Clearing browser data removes the list.

Export downloads a version 1 JSON backup. Restore by pasting that JSON into the
backup field. Imports validate the whole file before writing, accept at most one
million characters, and add only IDs not already present. Matching IDs are skipped,
never overwritten. The result reports added and skipped counts. This is an additive
restore; it does not undo deletions or replace changed existing issues. Export the
current list before reorganizing it. Import does not merge fields across versions.

## Compatibility and verification

The original 2023 history is preserved. January 11, 2024 introduces Vite 5.0.11,
TypeScript 5.3.3, Tailwind 3.4.1 and Node 20. November 21 updates React to 18.3.1 and
Vite to 5.4.11. Lockfile publication dates were audited at each introducing cutoff,
including transitive dependencies. Runtime tests use Node 20.19.0, a later Node 20
maintenance release; browser checks use current Chrome.

Tests cover existing records, issue actions, priorities, backup validation and
merging, corrupt storage, write failures, and changes made by another tab.

This historical toolchain has known advisories. Upgrade dependencies before using
it for a current public service. The local app is not a shared issue-management
system and has no automatic backup or synchronization.

## Reusable views

Save up to 12 named combinations of search, status, priority, and sort order.
Choose a view to apply it, then explicitly update it after changing filters.
Renaming and deleting views never change issues. Names are limited to 40 characters
and must be unique ignoring case. Search is limited to 200 characters.

Views use separate browser storage (`issue-desk-views-v1`). Invalid data is kept
untouched; conflicting changes from another tab require a reload. Issue backups
contain issues, not view definitions. Reset filters returns to the complete list.

## Batch changes

Select issues individually or select the visible results, then apply one status or
priority. Each action writes the entire list once; a failed write leaves the list
and selection intact. Filtering clears selection so hidden issues are not changed.
Finish editing an issue before running a batch action.

Undo reverses only the last successful batch change. A later issue edit, import,
or deletion invalidates undo. No-op batches keep the previous undo. Unseen storage
changes are never overwritten by undo; reload after exporting the current list.
