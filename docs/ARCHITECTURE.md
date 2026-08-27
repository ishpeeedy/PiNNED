# PiNNED — Architecture Notes

A teaching document. It explains *why* the canvas is built the way it is, what
was wrong with the original design, and the reasoning behind each decision.

Written to be read top to bottom once, then dipped into later.

---

## Table of contents

1. [The core problem: who owns a tile's position?](#1-the-core-problem-who-owns-a-tiles-position)
2. [Stale closures — the bug behind the ghost tiles](#2-stale-closures--the-bug-behind-the-ghost-tiles)
3. [The coordinate model](#3-the-coordinate-model)
4. [Why we removed react-rnd](#4-why-we-removed-react-rnd)
5. [Persistence: when writes happen](#5-persistence-when-writes-happen)
6. [Undo/redo: snapshots vs commands](#6-undoredo-snapshots-vs-commands)
7. [Client-generated IDs](#7-client-generated-ids)
8. [Glossary](#8-glossary)

---

## 1. The core problem: who owns a tile's position?

Every bug in the canvas traced back to one question with four different answers.

A tile's `x, y` was simultaneously "owned" by:

| # | Owner | Where |
|---|-------|-------|
| 1 | React state | `tiles[i].position` in `Board.tsx` |
| 2 | react-rnd's internal state | inside the library |
| 3 | The raw DOM `transform` string | written imperatively by the drag handler |
| 4 | Undo/redo snapshots | `history[]` in `Board.tsx` |

When four things claim to know where a tile is, they *will* drift apart. The
symptoms looked unrelated but shared this single root cause:

- Dragging a tile left `style.zIndex = '9999'` on the element forever. React
  never reset it, because **React only resets what React itself set** — it
  diffs props, not the DOM. So the stacking you saw after a drag disagreed with
  the stacking you got after a reload.
- Undo required remounting every tile (`key={id-undoRedoKey}`) to force
  react-rnd to forget its internal position. Needing to destroy your entire UI
  to change a number is a design smell, not a clever trick.
- The drag handler discovered where a tile was by **regex-parsing the DOM**:

  ```js
  const match = rndEl.style.transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
  ```

  That is the DOM acting as the database.

### The rule we adopted

> **React state is the only owner of a tile's position.**
>
> The DOM may be written to directly *during* a gesture, as a performance
> optimisation. On `pointerup` state is updated, and from that moment state is
> authoritative again.

"Write to the DOM during a drag" is a legitimate technique — it avoids
re-rendering 100 components 60 times a second. The mistake was never
*reconciling* back to state, and then *reading* from the DOM later.

---

## 2. Stale closures — the bug behind the ghost tiles

This is the most important concept in this document, because it caused the bug
you actually noticed: **deleting several tiles left some of them on screen,
un-clickable.**

### What a closure is

When a React component renders, every function defined inside it "captures" the
values of that render. It does not see the future.

```js
const [count, setCount] = useState(0);

const handler = () => {
  console.log(count); // whatever count was WHEN THIS RENDER HAPPENED
};
```

If `count` later becomes 5, that particular `handler` still prints the old
value. It closed over it. Hence: a *stale closure*.

### How it broke deletion

```js
// Board.tsx — the original
const handleDeleteTile = async (tileId) => {
  await tileAPI.deleteTile(id, tileId);
  const newTiles = tiles.filter((t) => t._id !== tileId); // captured `tiles`
  setTiles(newTiles);
};

const handleContextMenuDelete = async (tileId) => {
  for (const id of idsToDelete) {
    await handleDeleteTile(id); // called 3 times, same render
  }
};
```

Deleting tiles A, B, C:

| Iteration | Server | `setTiles` receives | Result on screen |
|---|---|---|---|
| 1 | A deleted | all tiles **minus A** | B, C still visible |
| 2 | B deleted | all tiles **minus B** | **A is back** |
| 3 | C deleted | all tiles **minus C** | **A and B are back** |

`await` does not refresh a closure. All three iterations read the same `tiles`
array from the same render, so each one *discarded* the previous deletion.

End state: all three tiles are gone from the database, but two are still drawn
on screen. Click one and it PATCHes a tile that no longer exists → 404 →
"Failed to update tile". **Ghost tiles.**

### The fix: functional updates

`setState` accepts a *function*, which React calls with the genuinely current
value — not a captured one:

```js
setTiles((prev) => prev.filter((t) => t._id !== tileId));
```

Now iteration 2 receives the result of iteration 1. Deletions accumulate.

### The same bug, quieter, in group drag

Dragging 3 selected tiles called `onTileUpdate` in a loop. Each call computed
`tiles.map(...)` from the same stale array, so only the last tile's new position
survived in state.

You did not *see* this, because react-rnd never rewrote the other tiles'
transforms (their `position` prop hadn't changed, so React skipped them) and the
imperative transform from the drag was still sitting in the DOM. The screen was
right; the server was right; **only React state was wrong.**

It surfaced later, in anything that read state instead of the DOM:

- **Undo** — remounts every tile from state, so tiles jumped back.
- **Search jump** — panned to the old coordinates.
- **Duplicate** — copied the old position.

> **Lesson:** a bug that is invisible is not a bug that is absent. Divergence
> between your state and your screen will always surface eventually, usually
> somewhere that looks unrelated.

---

## 3. The coordinate model

An infinite canvas has two coordinate systems. Confusing them is the second
biggest source of canvas bugs.

| Space | Meaning | Lives in |
|-------|---------|----------|
| **world** | A tile's true position. Unbounded, unaffected by pan/zoom. | MongoDB, React state |
| **screen** | Pixels in the browser window. | mouse events, `getBoundingClientRect()` |

The conversion is two lines of maths:

```text
screen = world * zoom + pan
world  = (screen - pan) / zoom
```

The DOM mirrors this exactly:

```html
<div style="transform: translate(panX, panY)">   <!-- pan: screen pixels -->
  <div style="transform: scale(zoom)">           <!-- zoom -->
    <tile style="transform: translate(x, y)" />  <!-- world units -->
```

### What went wrong

The maths was correct, but it was **hand-written inline in five different
places**, and two had already drifted:

- `jumpToTile` measured a *different div* than the drop handler, so search
  centring was subtly off.
- Zoom never adjusted `pan`, so zooming appeared to fling the board away.

### The rule we adopted

> All conversion goes through `src/lib/viewport.ts`. No inline coordinate maths
> anywhere else, ever.

Five call sites, one implementation. They cannot disagree if there is only one
of them.

### Zoom anchoring

Naive zoom multiplies everything by a new scale, keeping world origin `(0,0)`
fixed. Since your tiles are nowhere near the origin, they fly off screen.

Correct zoom keeps a chosen **anchor point** stationary: pick a screen point,
work out which world point is under it, change the zoom, then adjust `pan` so
that same world point is still under that same screen point.

```text
worldUnderAnchor = (anchor - pan) / oldZoom
newPan           = anchor - worldUnderAnchor * newZoom
```

Which anchor depends on the input:

| Input | Anchor | Feels like |
|-------|--------|-----------|
| Mouse wheel / pinch | the cursor | Figma, Google Maps |
| Toolbar +/- buttons | viewport centre | a zoom control |

Same function, different anchor argument.

---

## 4. Why we removed react-rnd

Not for speed. Drag performance was already fine — the drag path wrote
transforms directly to the DOM and never re-rendered.

The real reason is **memoization**.

### The problem

Every tile update replaced the whole `tiles` array, so every tile re-rendered —
including its images and scroll areas. The standard fix is `React.memo`, which
skips a re-render when a component's props haven't changed.

But `React.memo` compares props by reference, and `<Rnd>` was being handed fresh
object literals on every single render:

```jsx
<Rnd
  position={{ x: tile.position.x, y: tile.position.y }} // new object every render
  size={{ width: ..., height: ... }}                    // new object every render
  enableResizing={{ bottom: true, ... }}                // new object every render
/>
```

Three brand-new objects each time means props are *never* equal, so memo can
never skip anything. **react-rnd structurally defeated the optimisation.**

You could memoize each of those objects individually — but at that point you are
writing more code to work around the library than the library saves you.

### What we gained

| | With react-rnd | Owning it |
|---|---|---|
| DOM nodes per tile | ~11 (8 resize handles always rendered) | ~3 (handles only when selected) |
| 100-tile board | ~1100 nodes | ~300 nodes |
| `React.memo` | ineffective | works |
| Undo | remount ~1100 nodes, image loaders flash | plain state update |
| zIndex leak | fixable by hand, can regress | structurally impossible |
| Bundle | +~12 KB gzip | 0 |

The trade is roughly 180 lines of pointer-event code we now own. Worth it, given
it also deletes ~200 lines of workarounds that only existed to fight the library.

---

## 5. Persistence: when writes happen

### The decision: no debounce

It is tempting to debounce network writes ("wait 500ms, then save"). We
deliberately did not, and the reasoning is worth understanding.

**Debouncing was never what made the UI feel fast or slow.** The UI is already
instant because it is *optimistic*: the tile moves in the DOM during the drag,
and local state updates the moment you release. The network request is invisible
— it could take a full second and the screen would look identical.

So debouncing buys nothing on responsiveness, and it *costs* something real: a
**loss window**. For those 500ms the change exists only in the browser. Close the
tab and it's gone.

### What we do instead: commit on gesture end

Every interaction in this app already has a natural end point:

| Gesture | Commits on | Requests |
|---------|-----------|----------|
| Drag / resize | `pointerup` | 1 (batched) |
| Text / caption edit | blur | 1 |
| Colour, z-order, delete | the click | 1 |

The gesture boundary *is* the coalescing, and it is better than a timer because
it is exact rather than a guess. Move 40 tiles, release once, send one request.

### Batching

Before: `PATCH /boards/:id/tiles/:tileId` — one tile per request. Moving 5 tiles
meant 5 HTTP round-trips, each with its own auth check and DB write.

After: one endpoint taking many changes, applied server-side with a single
MongoDB `bulkWrite`:

```text
PATCH /boards/:id/tiles
[ { id: "a", position: {...} }, { id: "b", position: {...} } ]
```

**Debouncing and batching are different axes.** Debounce is *when* you send.
Batching is *how much per send*. We batch, and we don't debounce.

### Concurrency

Three failure modes, and how each is handled:

| Risk | Handling |
|------|----------|
| Tab closed mid-write | flush on `pagehide` via `navigator.sendBeacon`, which browsers deliver even as the page dies |
| Two writes for one tile racing, older lands last | a `Map<tileId, pending>`; if a request is in flight, overwrite the pending entry rather than firing a second |
| Write fails | keep the optimistic state, mark dirty, retry once, only then surface an error |

That last one deserves emphasis. The original code did `setTiles(tiles)` on
error — reverting to a stale snapshot, which was *worse* than the failure.
**Because PiNNED is single-writer** (one user, no real-time collaboration), the
client is always right. Last-write-wins is unconditionally correct here, and we
skip conflict resolution entirely.

Decisions like "no multi-tab support" are not laziness — they are constraints
that buy simplicity elsewhere. Know which ones you are buying.

---

## 6. Undo/redo: snapshots vs commands

### What it was: snapshots

Before every change, deep-copy the entire tile array and push it on a stack.

```text
[100 tiles] → [100 tiles] → [100 tiles] → ...  (up to 50 deep)
```

Simple, but: 50 × 100 = 5000 tile copies held in memory, and undoing means
reconciling that whole array against the server. The original sync did
`GET all` → N deletes → M updates → K creates → `GET all`, **serially**. Undoing
on a 30-tile board was roughly 60 sequential round-trips against a free-tier
server that cold-starts.

### What it is: commands

Store only what changed, plus how to reverse it.

```js
{
  do:   [{ id: 'a', position: { x: 300, y: 200 } }],
  undo: [{ id: 'a', position: { x: 100, y: 100 } }]
}
```

Undo = apply the `undo` side to local state, send it as **one** batch request.

| | Snapshots | Commands |
|---|---|---|
| Memory (100-tile board) | ~5000 tile copies | ~50 small objects |
| Requests to undo | ~60 sequential | 1 |
| 40-tile group drag | 40 broken entries | 1 entry |
| Entry created by a mere click | yes (bad) | no |

The cost is writing an inverse for each operation type — move, resize, colour,
z-order, create, delete. Six of them. That is the entire tax.

### Deliberate scope: structural operations only

`Ctrl+Z` undoes moves, resizes, creates, deletes, colour and z-order changes.

It does **not** undo committed text edits. While your cursor is inside a text
field, `Ctrl+Z` is the browser's own character-level undo, which is what you
actually want there — the keyboard handler explicitly ignores events originating
from `INPUT`, `TEXTAREA` and `contentEditable` elements.

The seam: once you click away and the edit commits, `Ctrl+Z` undoes the last
*structural* action instead. This is a deliberate simplification; adding text to
the command history later is purely additive (one more command type with an
inverse).

---

## 7. Client-generated IDs

Traditionally the server mints a record's ID. We let the client mint tile IDs
instead (as ObjectId-compatible strings, so MongoDB is happy).

Three problems this solves:

1. **Undo of a delete used to change the ID.** The old sync recreated deleted
   tiles, and the database assigned a *new* `_id`. Any reference to the old ID —
   selection, history entries, in-flight requests — silently broke. This was a
   second route to ghost tiles.
2. **New tiles weren't interactive until the server replied.** Now a tile has
   its identity the instant it exists, so it is draggable immediately.
3. **Duplicating N tiles was N requests.** Now it's one batch.

The theoretical cost is trusting the client for uniqueness. ObjectId collisions
are astronomically unlikely, and the server can still reject duplicates. This is
a very good trade.

---

## 8. Glossary

**Optimistic update** — apply a change to local state immediately, assuming the
server will accept it, rather than waiting for confirmation. Makes the UI feel
instant. Requires a plan for when the assumption is wrong.

**Stale closure** — a function capturing values from an old render and acting on
them as if current. The cause of the ghost tiles. Fix: functional `setState`.

**Debounce** — "wait until activity stops, then act once." Five keystrokes
become one save. Trades request count for a data-loss window.

**Throttle** — "act at most once every N ms." For continuous streams like
scroll. Different from debounce: throttle fires *during*, debounce fires *after*.

**Batching** — many changes in one request. Orthogonal to debounce.

**Memoization** (`React.memo`) — skip re-rendering a component when its props
haven't changed. Compares by reference, so passing fresh object literals defeats
it.

**Idempotent** — an operation safe to apply twice. `set position to (10,20)` is
idempotent; `move right by 10` is not. Our batch writes are idempotent, so a
retry after an ambiguous failure is always safe.

**World / screen space** — see [section 3](#3-the-coordinate-model).

**Single-writer** — only one client ever modifies the data. Removes the need for
conflict resolution.

**Cascade delete** — deleting a parent removes its children. Deleting a board
originally left its tiles (and their Cloudinary images) orphaned forever.

**SSRF** (Server-Side Request Forgery) — tricking a server into fetching a URL
on your behalf, typically to reach internal addresses a browser could not. The
`/api/metadata` endpoint fetches user-supplied URLs, so it needs a guard against
private IP ranges.

**Mass assignment** — copying a request body straight into a database update, so
a client can write fields it was never meant to touch. The tile PATCH did
`$set: req.body`; the fix is an explicit field whitelist.
