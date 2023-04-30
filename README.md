# Issue Desk

A small browser issue tracker.

Created in September 2026 as a reconstruction using technology available in
April 2023. Historical commit dates were intentionally assigned and do not
represent when the project was originally written or published.

Use Node 18, then run `npm ci` and `npm run dev`. Run `npm run build` for production.

Track one personal list: add a title and optional notes, edit details, change
status, search, filter, or delete with confirmation. Data stays in this browser's
localStorage; there is no account, server, synchronization, or backup. Use one tab
at a time. Clearing browser data removes the list. Avoid sensitive information.

Saved data is validated on startup. Unreadable or invalid storage disables changes
without replacing it. Failed writes leave the list and entered form unchanged so
you can retry after freeing storage. Titles allow 100 characters, notes 1,000.
Search checks both fields and combines with the status filter.

Development commands:

```sh
npm ci
npm run dev
npm test
npm run build
```

React 18.2, TypeScript 5.0.3, Vite 4.2.1, and Tailwind 3.3.1 match the April 2023
scope. The lockfile was resolved with an April 10, 2023 cutoff, including transitive
packages. Node 18.20.5 was used for verification; it is a later Node 18 maintenance
release, not a release available at the assigned dates. Browser verification used
current Chrome. The UI uses standard forms, Flexbox/Grid, and localStorage.

This intentionally historical development toolchain has known security advisories.
Keep the development server on loopback and upgrade dependencies before adapting
this project for a current production service.
