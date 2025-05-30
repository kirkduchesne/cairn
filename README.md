# Issue Desk

A browser-local issue tracker for a small personal backlog. Organize work with
reusable views, change several issues together, and keep portable JSON backups.

![Issue Desk with a sample personal backlog](docs/preview.png)

## Run

Use Node 20 and npm:

```sh
npm ci
npm run dev
npm test
npm run build
```

The development server binds to loopback. The app needs no account, backend, or
external service. React 18.3, TypeScript 5.8, Vite 6.2, and Tailwind 3.4 keep the
implementation small; dependencies are pinned in the lockfile.

## Work with issues

- Add titles, notes, status, and priority. Search and combine status/priority
  filters, then sort by title, priority, or original order.
- Save up to 12 named views. Apply, rename, update, or delete a view without
  changing the issues. Reset filters returns to the complete list.
- Select visible issues and apply one status or priority in a single storage
  write. Filtering clears selection. Finish editing before a batch action.
- Undo the last successful batch operation. A later issue edit, import, or
  deletion invalidates undo; no-op batches keep it available.
- Use the summary to see overall status and unfinished high-priority counts.
  Summary buttons open the corresponding status view.
- Alt+N focuses the title; Alt+F focuses search. Keyboard help lists these
  shortcuts. Browser and system shortcuts can take precedence.

## Backups and limits

Export the complete list or only visible results. Filenames include the scope
and UTC date. Restore by pasting JSON, previewing new/skipped counts, and
confirming. Imports add only unseen IDs; existing IDs are never replaced.
Canceling the preview writes nothing. Issue backups do not include saved views.

The app accepts 500 issues, 100-character titles, 1,000-character notes, and
five-million-character backups. Larger legacy lists remain readable; export
filtered subsets of at most 500 issues before reorganizing them. Export uses the
same validation as import and refuses files that could not be restored. View names allow 40 characters and must be unique ignoring case;
search allows 200 characters.

Issues retain the original `issue-desk-v1` key. Views use `issue-desk-views-v1`.
Legacy issues receive Normal priority and an unknown update time. Invalid storage
is preserved. Failed writes retain the current data and entered form. Writes
check for changes made since this tab loaded or last saved; if a conflict occurs,
export your current list and reload. This is a stale-write check, not a
transactional synchronization system. Use one active tab. Clearing browser data
removes your work, so export backups and avoid sensitive information.

## Verification

Unit/component tests cover filters, view validation and persistence, migrations,
batch writes and undo, keyboard handling, import previews, export errors, and
storage conflicts. `tests/browser.cjs` exercises the actual UI with external
Playwright and Chrome against `ISSUE_TEST_URL` (default `http://127.0.0.1:8502`).
It checks reload persistence, views, batch undo, downloads, imports, keyboard
focus, and 375px layouts including maximum-length text. CI runs tests and build.
The screenshot shows nonpersonal sample issues entered through the UI.

## Project history

- **2023:** Basic typed React issue list with local persistence.
- **2024:** Priorities, timestamps, backups, storage protection, and recovery tests.
- **2025:** Reusable views, safe batch operations, summaries, keyboard controls,
  and previewed imports. The April dependency upgrade was checked against
  registry publication dates, including transitive packages.

Created in September 2026 as a reconstruction using technology available in the
assigned periods. Historical author and committer dates were intentionally
assigned and do not establish original publication in those years. Verification
used Node 20.19.0 and current Chrome. This period-specific toolchain has known
advisories; upgrade it before adapting the project for a current public service.
