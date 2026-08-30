# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Chinese-style family tree (家谱) visualization app. All UI text, code comments, and docs are in Simplified Chinese — keep new user-facing strings and comments in Chinese to match.

## Commands

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview the production build
```

No test framework and no linter are configured.

## Stack

Vue 3 (`<script setup>` composition API) + Vite. No router, no state management library, no UI framework, no TypeScript. Only runtime dependency besides Vue is `html-to-image` (PNG export).

## Architecture

### State: `useFamilyData.js` is the single store

`src/composables/useFamilyData.js` is instantiated exactly once (in `App.vue`) and holds all app state. There is no Pinia/global store — state flows props-down/events-up through `App.vue`, which routes every event between components. Dialog visibility (`showImport`, `showStats`, `editDialog`) lives in `App.vue`.

- `familyData` is one nested root-node object (the whole tree). A deep `watch` auto-persists it to `localStorage` under key `family-tree-data-v1`. Mutate the tree **in place** (`findNodeById` then assign fields) so the deep watcher fires.
- `updatePerson` only copies a whitelist of fields, protecting `id`/`children` structure. `addChild` auto-derives `generation = parent.generation + 1`. The root node cannot be deleted (`isRoot`).
- Import flow: `ImportDialog.vue` does its own light validation (requires `id`/`name`) and emits `imported`; `App.vue` then sets `familyData` directly, clears search, and resets the view. The stricter recursive `validateData`/`importJSON` in `useFamilyData.js` exists but is not wired to the dialog.

### Data model: spouses are not tree nodes

Only blood-line members are nodes in the recursive `children` tree. Spouses are embedded data on a node:

- New format is a `spouses` array (元配/继配/三配…); legacy singular `spouse` object is still supported, and the built-in sample data (`src/data/sample.js`) uses the legacy form. **Always read spouses via `getSpouses(person)` from `src/utils/family.js`** — never access `person.spouses` directly. When writing, set `spouses` and null out `spouse`.
- When a spouse card is clicked, a synthetic person is emitted with id `{personId}-spouse-{idx}`, `partnerId` pointing back to the node, and `spouseIndex` — `EditPersonDialog`/`App.vue` use these to route edits back to the owning node.
- A child may carry `birthSpouseIndex` — an index into its parent's `spouses` array indicating the birth parent.

### Rendering: `TreeNode.vue` is recursive

`FamilyTree.vue` is the zoom/pan viewport (via `useZoomDrag.js`); `App.vue` drives it imperatively through a template ref (`defineExpose`: `resetView`, `zoomIn`, `zoomOut`, `scale`, `getCanvasElement`). Parent→child connector lines are plain CSS divs (`.vline-parent`, `.vline-child`, etc.; the horizontal line is assembled from per-branch `.hline` halves — there is intentionally no `.children-row::before` line, it dangles past the last child). Subtrees are horizontally aligned to the blood-line member's card, not the card+spouse row: `measure()` in `TreeNode.vue` applies a `translateX` offset to `.children-container` equal to half the spouse block's width (spouse chips stay in flow so they keep reserving space). Birth-parent links are an SVG overlay per node, drawn as orthogonal elbow paths (竖直下→横移→竖直落到子线，水平段走两代之间的正中) measured via `getBoundingClientRect` relative to the wrapper (cancels the shared canvas transform) and re-measured on resize via `ResizeObserver` + watchers.

### Export & print

`App.vue` always calls `handleResetView()` and awaits `nextTick()` before capture. PNG export (`utils/exportImage.js`) passes an explicit `width`/`height` and overrides `transform: none` in the html-to-image style so the full tree is captured regardless of current zoom. Print styles live in `@media print` in `src/style.css`.

### Avatars

Uploaded avatars go through `utils/image.js` (`fileToResizedDataURL`): resized to ≤256px JPEG dataURL, because the whole tree is persisted in `localStorage`.
