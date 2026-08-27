# PiNNED — Refactor Plan

Living document. Steps are checked off as they land. Each step is a separate
commit (or a few), so any of them can be reverted independently.

Background reading: [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Decisions made

| # | Decision | Choice |
|---|----------|--------|
| 1 | Board state location | Zustand store (enables memoization) |
| 2 | Tile IDs | Client-generated, ObjectId-compatible |
| 3 | Batch endpoint scope | Updates + creates + deletes in one call |
| 4 | Undo covers text edits? | No — structural operations only |
| 5 | Semantic search | **Parked.** Currently falling back to regex |
| 6 | Backend build | Commit to `tsx`; delete the non-functional `tsc` path |
| 7 | zIndex model | Normalise to dense `0..n-1` |
| 8 | Persist viewport per board | Yes |
| 9 | Snapping | No — not wanted |
| 10 | Multi-tab / real-time | No — single-writer assumption |
| 11 | Delete mode | Cut; replaced by multi-select + Delete key |
| 12 | react-rnd | Remove (option C) |

---

## Environment note

This machine has no system Node install. A **portable Node 24.20.0** lives in the
session scratchpad and is used only for typecheck / lint / build / tests. Nothing
was installed to the system, and no PATH was modified.

There are **no `.env` files** locally, so the app cannot be run end-to-end here.
Verification is therefore split:

- **Machine-verifiable** — typecheck, lint, production build, unit tests.
- **Human-verifiable** — anything perceptual or requiring a live DB. Collected
  in [Manual QA checklist](#manual-qa-checklist) at the bottom.

### Baseline before any changes

| Check | Result |
|-------|--------|
| Frontend `tsc -b` | clean |
| Backend `tsc --noEmit` | clean |
| Frontend `eslint` | 18 errors, 6 warnings (pre-existing) |
| `vite build` | succeeds |
| `Board` chunk | 111.57 kB / **32.82 kB gzip** |

Pre-existing lint errors are **not** in scope — they are mostly `no-explicit-any`
in `NotFound.tsx` and auth pages. The rule is: do not increase these counts.

---

## Stage 1 — Critical bug fixes

Independent of the refactor. Safe, small, individually revertible. These are
worth shipping on their own.

- [x] **1.1** Functional `setState` everywhere — fixes ghost tiles
- [x] **1.2** Hardcoded `localhost:5000` in drag-drop upload
- [x] **1.3** Store `cloudinaryPublicId` on dropped images
- [x] **1.4** `searchMatchIds` never destructured — text matches don't glow
- [x] **1.5** Cascade-delete tiles + Cloudinary assets when a board is deleted
- [x] **1.6** Add indexes on `Tile.boardId` and `Board.userId`
- [x] **1.7** Whitelist fields on tile PATCH (mass assignment)
- [x] **1.8** Backend build config honesty (`tsx`)

## Stage 2 — Pure modules and tests

New files only; nothing imports them yet, so risk is zero.

- [x] **2.1** Add vitest
- [x] **2.2** `src/lib/viewport.ts` — `screenToWorld`, `worldToScreen`, `zoomAt`
- [x] **2.3** `src/lib/history.ts` — command reducer and inverses
- [x] **2.4** `src/lib/ids.ts` — ObjectId-compatible ID generation
- [x] **2.5** Unit tests for all of the above

## Stage 3 — State layer

- [ ] **3.1** Zustand board store: tiles, selection, viewport, pending writes
- [ ] **3.2** Board.tsx reduced to a thin container
- [ ] **3.3** Canvas subscribes to the store instead of taking ~30 props

## Stage 4 — Persistence and history

- [x] **4.1** Backend batch endpoint (upsert + delete, one `bulkWrite`, size cap)
- [ ] **4.2** Client-generated IDs wired through creation
- [ ] **4.3** Commit-on-gesture-end, in-flight map, `pagehide` flush
- [ ] **4.4** Command history replaces snapshots; delete `syncTilesToBackend`

## Stage 5 — Remove react-rnd

The step that needs your eyes. Left until state is clean and tested.

- [ ] **5.1** Own drag and resize via pointer events
- [ ] **5.2** Memoized tile component
- [ ] **5.3** Delete the `undoRedoKey` remount hack and the zIndex 9999 leak
- [ ] **5.4** Drop the `react-rnd` dependency

## Stage 6 — Interactions

- [ ] **6.1** Cursor-anchored wheel zoom; viewport-centre button zoom
- [ ] **6.2** Lasso / marquee selection
- [ ] **6.3** Keyboard: Delete, Escape, arrow-key nudge, Ctrl+A
- [ ] **6.4** Remove delete mode
- [ ] **6.5** Persist viewport per board
- [ ] **6.6** Normalise zIndex

## Stage 7 — Backend hygiene

- [ ] **7.1** `loadBoard` middleware replacing ~8 copy-pasted ownership checks
- [~] **7.2** Zod validation on request bodies
- [ ] **7.3** Central error handler + `asyncHandler`
- [ ] **7.4** Rate limiting (upload, auth, metadata)
- [ ] **7.5** SSRF guard on `/api/metadata`
- [ ] **7.6** Drop redundant `board.save()` on every tile write
- [ ] **7.7** Fix `tileCount` drift

## Parked

- Semantic search — decide fix vs cut. Note it currently burns Gemini quota on
  every tile write for embeddings nothing reads.
- Dead schema fields: `visibility`, `allowDuplication` (no route reads them).

---

## Manual QA checklist

Things I cannot verify without a running app and a real database. Run these
against the deployed site after Stage 1 lands.

### Stage 1

1. **Ghost tiles.** Ctrl-click 3 tiles → right-click → Delete. All three should
   disappear and stay gone. Reload to confirm.
2. **Drag-drop upload.** Drag an image file from your desktop onto the canvas on
   the deployed site. It should upload (previously this hit `localhost:5000` and
   failed in production).
3. **Cloudinary cleanup.** Create an image tile by drag-drop, delete it, confirm
   the asset is gone from the Cloudinary `pinned` folder.
4. **Board cascade.** Create a board, add tiles, delete the board. Confirm no
   orphaned tiles remain in the `tiles` collection.
5. **Search glow.** Type a query matching several tiles. All matches should glow,
   not only the focused one.

### Later stages

Added as those stages land.
