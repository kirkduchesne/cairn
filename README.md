# Issue Desk

A browser-local tracker for a small personal backlog. Tag and group active work,
archive completed issues, reuse saved views, and keep portable backups.

![Issue Desk with a sample personal backlog](docs/preview.png)

## Run

Use Node 20 and npm:

```sh
npm ci
npm run dev
npm test
npm run build
```

The development server binds to loopback. No account, backend, or external
service is needed. React 18.3, TypeScript 5.8, Vite 6.2, and Tailwind 3.4 are
pinned with their transitive dependencies.

## Work with issues

- Create issues with notes, priority, and up to five tags. Search title, notes,
  and tags; combine status, priority, tag, and active/archive filters.
- Sort by title, priority, added order, or update time. Unknown legacy update
  times sort last. Group results by status or priority.
- Archive completed issues to keep active work focused. Archived records keep
  their contents; restore them before editing. Archive and restore work in batches.
- Select visible results to change status, priority, or tags in one storage
  write. A tag limit failure leaves the entire batch unchanged. Finish editing
  before batch actions. Undo the last successful batch; later issue changes
  invalidate undo, while no-op batches preserve it.
- Save, reorder, duplicate, rename, and update up to 12 named views. Export and
  import views separately; name and ID collisions receive new values.
- Alt+N focuses the title and Alt+F focuses search. Cancel editing or clear a new
  draft to reset the editor. Unfinished edits warn before leaving; browser and
  system shortcut or unload behavior can vary.

## Backups and recovery

Export all issues, visible results, or a text count summary. Issue backup
filenames include scope and UTC date. Paste JSON, preview it, and confirm an
additive import. Existing issue IDs are skipped rather than replaced. View
backups use a separate format and never change issues.

The list accepts 500 issues, 100-character titles, 1,000-character notes, and
five-million-character issue backups. Tags are normalized to lowercase and allow
24 characters each. Views allow 40-character names, 200-character searches, and
100,000-character backups. Larger legacy issue lists remain readable; export
filtered subsets of at most 500 records. Export validation matches import.

Issues retain `issue-desk-v1`; views use `issue-desk-views-v1`. Legacy issues are
active with no tags, Normal priority, and an unknown update time. Older views
use active scope and no grouping or tag filter. Invalid storage is preserved
and changes are blocked; download unreadable issue storage as text for manual
recovery. Raw recovery text is not necessarily a valid backup.

Failed writes retain the entered form and current data. Writes detect changes
made since this tab loaded or last saved. On a conflict, export your current
list and reload. This is a stale-write check, not transactional synchronization;
use one active tab. Clearing browser data removes work. Keep backups and avoid
sensitive information.

## Verification

Unit/component tests cover schema limits, legacy records, tags, queries,
archive eligibility, grouping, atomic batches and undo, view backups, storage
conflicts, editor protection, recovery, and download failures. CI runs tests and
build with pinned actions. Browser scripts use an external Playwright runtime
and current Chrome against a running app:

```sh
ISSUE_TEST_URL=http://127.0.0.1:8602 node tests/browser.cjs
node tests/archive-browser.cjs
node tests/views-browser.cjs
node tests/mobile-browser.cjs
```

Set `ISSUE_TEST_URL` for a different server. The three newer suites default to
port 8602; the original suite retains its 8502 default. Browser coverage includes
reload, backups, view collisions, archive/restore, keyboard focus, and 375px
layouts. The screenshot uses nonpersonal sample issues.

## Project history

- **2023:** Typed React issue list with local persistence.
- **2024:** Priorities, timestamps, backups, and storage protection.
- **2025:** Reusable views, safe batches, summaries, and previewed imports.
- **2026:** Tags, archives, grouping, portable views, and local recovery.

Created in September 2026 as a reconstruction using technology available in the
assigned periods. Historical author and committer dates were intentionally
assigned and do not establish original publication in those years. Verification
used Node 20.19.0 and current Chrome. The unchanged dependency lock was checked
against January 2026 registry publication dates. This period-specific toolchain
has known advisories; upgrade it before adapting the project for a current public service.
