# Missing functionality in SVG path editor
_Exported on 3/8/2026 at 19:24:56 PDT from Cursor (2.6.13)_

---

**User**

This project is a port of C:\y\w\7-third-parties-learn\svg-path-editor from Angular to React. The original project has for each point on canvas selection. When SVG point is selected the corresponding cell as edit control in commands panel is highlighted. This functionality was missing during the initial port. Also check what else is missing.

---

**Cursor**

I’ll compare the current React port against the Angular source to restore point-selection-to-command-cell highlighting, then scan for other missing parity items. First I’m mapping where point selection and command panel rendering live in both codebases.

I found the likely React files (`canvas`, `editor panels`, and path state) plus Angular counterparts (`app.component` + canvas template). Next I’ll read these side-by-side to wire the missing selection highlight behavior and spot other parity gaps.

I’ve confirmed the Angular behavior: point drag/select sets a focused command and scrolls that command row into view. I’m now tracing the React command list and canvas interactions to add the same linkage and identify any other missing parity features in this ported area.

I confirmed Angular ties point interaction to a focused command row and uses editable per-value controls. I’m checking the old SVG model logic next to bring over the same index mapping cleanly in React rather than approximating it.

I’ve pinpointed the root gap: React currently renders command rows as read-only text, so there’s no selectable/editable command cell to sync with point selection. I’m implementing parity in this area now by: (1) adding a shared selected-command state, (2) making canvas points selectable, (3) converting command rows into editable cells with highlight + auto-scroll on selection, and (4) wiring value edits back into the path model. After that I’ll run lint/build and report additional parity gaps I find but didn’t fully port yet.

I’ve wired the new shared selection/edit flow and am validating it now with lints/build to catch regressions before I summarize parity gaps.

Implemented the missing canvas-point-to-command-cell linkage, and restored editable command cells in the React port.

### What I changed

- Added shared selection state in `src/store/0-atoms/2-svg-path-state.ts` via `selectedCommandIndexAtom`.
- Made canvas points selectable in `src/components/2-editor/3-canvas/2-canvas.tsx`:
  - click a point => selects command index
  - selected point gets a distinct visual highlight
  - click empty SVG background => clears selection
- Upgraded the Commands panel in `src/components/2-editor/2-props/3-editor-panels.tsx`:
  - rows are now selectable/highlighted
  - auto-scrolls selected row into view (matching Angular behavior)
  - values are now editable controls again (text numeric inputs + arc `laf/swp` checkboxes)
  - focusing/editing a control keeps command selection in sync
- Added path model mutation API in `src/svg-core/model.ts`:
  - `setSegmentValue(segmentIndex, valueIndex, value)` for command-cell edits to update the actual SVG path.

### Verification

- Ran `pnpm build` successfully (TypeScript + Vite build passed).

### Other parity gaps still missing (quick audit)

Compared with the Angular app, these are still not ported yet:

- Dragging target/control points on canvas (and control handles visualization/editing).
- Command row actions: insert after, convert type, delete.
- Command-type click toggle (relative/absolute) at row level.
- Canvas segment hover/focus overlay highlighting.
- Full viewport controls (manual `x/y/width/height`, lock, zoom-fit/in/out buttons, pan/wheel parity).
- Snap-to-grid / ticks / fill / preview parity.
- Open/save/export dialogs and image editing mode.

If you want, next I can tackle the highest-impact missing piece: **point dragging + control points**, since it unlocks most of the original editing flow.

---

**User**

Let's make a plan on what is missing, so it can be done step by step

---

**Cursor**

I’ll do a quick parity audit in parallel (Angular source vs React port) and then turn it into a phased, dependency-aware implementation plan you can execute step by step.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I’ll execute the attached roadmap end-to-end, starting with the first todo (`foundation-geometry-state`) and moving sequentially through all todos while updating status as each phase completes. I’m first syncing todo state and then implementing the geometry/state foundation files.

I’ve gathered the current state and I’m now implementing the model/store foundation first, including editable control-point geometry and drag/hover/focus interaction atoms, so later canvas and commands features can plug into stable APIs.

I’ve landed the core canvas interaction scaffold (drag/pan/zoom/helpers/segment overlays/image handles) and am now upgrading the commands panel with full row actions, command toggles, hover sync, and keyboard parity.

Core parity features are now implemented and building; I’m finishing the last todo (`qa-stabilization`) by adding lightweight regression tests for model + history/store behavior and running them.

Implemented the full parity roadmap end-to-end and completed all todo items in the task tracker.

### What was delivered

- **Geometry + model foundation**
  - Extended `SvgPathModel` with canvas-editable geometry APIs (targets, controls, relation lines, standalone segment paths).
  - Added command mutation capabilities: insert, convert type, toggle rel/abs, delete, point/control movement.
  - Upgraded bounds calculation to include control geometry, improving fit behavior.
  - File: `src/svg-core/model.ts`

- **State + interaction foundation**
  - Expanded editor atoms for:
    - selection/hover/drag state
    - canvas viewBox/pan/zoom/fit/lock
    - command editing actions
    - image editing state
    - open/save/export state
  - File: `src/store/0-atoms/2-svg-path-state.ts`

- **Canvas interaction parity**
  - Added pointer drag for path target/control points.
  - Added canvas pan and wheel zoom around cursor.
  - Added hovered/focused segment overlays and helper relation lines.
  - Added grid/ticks rendering and preview/fill behavior wiring.
  - Added image edit handles (move/resize) and focus behavior.
  - File: `src/components/2-editor/3-canvas/2-canvas.tsx`

- **Commands panel parity**
  - Added row hover sync with canvas.
  - Added command token rel/abs toggle.
  - Added row action menus: insert after, convert to, delete.
  - Added keyboard parity:
    - `Ctrl/Cmd+Z`, `Shift+Ctrl/Cmd+Z`
    - command key insert/convert (`m/l/v/h/c/s/q/t/a/z`)
    - delete/backspace on selected command/image
    - arrow boundary navigation between value cells
  - File: `src/components/2-editor/2-props/3-editor-panels.tsx`

- **View/config parity**
  - Added viewBox numeric controls (`x/y/w/h`) + lock toggle.
  - Added zoom in/out/fit controls.
  - Added snap/ticks/fill/preview/image-mode toggles and precision controls.
  - File: `src/components/1-toolbar/3-toolbar-view-settings-popover.tsx`

- **Open/Save/Export + image workflows**
  - Added Save Path dialog + browser storage persistence.
  - Added Open Path dialog with mini SVG preview and delete.
  - Added Export SVG dialog with fill/stroke options and download.
  - Added Upload Image flow with placement dialog and canvas integration.
  - File: `src/components/2-editor/2-props/4-canvas-actions-menu.tsx`

- **QA stabilization**
  - Added automated regression tests with Vitest:
    - model behavior tests
    - state/history/viewbox workflow tests
  - Files:
    - `src/svg-core/model.test.ts`
    - `src/store/0-atoms/svg-path-state.test.ts`
  - Config/scripts:
    - `vite.config.ts` (Vitest config)
    - `package.json` (`test` script)
    - `pnpm-lock.yaml` (dependency updates)

### Validation run

- `pnpm test` ✅ (2 files, 5 tests passed)
- `pnpm build` ✅ (TypeScript + Vite production build passed)

If you want, I can do a final manual parity checklist pass against the Angular app (interaction-by-interaction) and give you a strict gap report of anything still behaviorally different.

---

**User**

Yes, that would be interseting to see a final manual parity checklist pass against the Angular app.

---

**Cursor**

I’ll run a fresh side-by-side parity audit now (Angular behavior as baseline vs current React implementation) and return a concrete checklist with `match / partial / missing`, including exact file references for each item.

## Final Parity Checklist Pass

Point-to-command selection sync is now in place: selecting a canvas point highlights the corresponding command row/cells in React (implemented via `selectedCommandIndex` flow across `src/components/2-editor/3-canvas/2-canvas.tsx`, `src/components/2-editor/2-props/3-editor-panels.tsx`, and `src/store/0-atoms/2-svg-path-state.ts`).

### Status vs Angular baseline

- `Canvas interactions` — **Mostly match**
  - Match: target/control drag, hover/focus segment overlays, pan, wheel zoom, selection clear.
  - Partial: touch pinch zoom parity (Angular has it; React currently does not).
- `Commands panel` — **Mostly match**
  - Match: editable cells, arc flags, row actions (insert/convert/delete), rel/abs toggle, row hover/selection sync.
  - Partial/Missing:
    - guard-based disabling for invalid insert/convert options (Angular disables; React allows menu entries and relies on model guard)
    - value tooltips (`x`, `y`, `rx`, etc.) missing
    - arrow up/down cross-row keyboard navigation missing (left/right exists)
- `View/config` — **Match**
  - Match: manual `viewBox` controls, lock/unlock, zoom in/out/fit, snap, ticks+interval, fill, preview.
- `Open/Save/Export` — **Mostly match**
  - Match: named save/open/delete in browser storage, export download flow.
  - Partial/Missing:
    - export dialog-level editable/resettable viewBox (Angular has reset/live export viewport controls)
    - live export preview missing
- `Image mode` — **Mostly match**
  - Match: upload/import, move/resize handles, opacity/aspect/delete controls.
  - Partial: Angular-style on-canvas contextual image menu is not mirrored exactly (React uses side-panel controls).
- `Keyboard shortcuts` — **Mostly match**
  - Match: undo/redo, letter-key insert/convert, delete/backspace for command/image, escape clears selection.
  - Missing: escape-to-cancel-drag-and-revert-current-drag-state behavior from Angular.

## Remaining gaps to reach strict parity

- Add pinch-zoom handling in `src/components/2-editor/3-canvas/2-canvas.tsx`.
- Add disabled-state logic for invalid Insert/Convert entries in `src/components/2-editor/2-props/3-editor-panels.tsx` using model guards.
- Add command value tooltips in `src/components/2-editor/2-props/3-editor-panels.tsx`.
- Add ArrowUp/ArrowDown cross-row cell navigation.
- Add escape drag-cancel rollback behavior in canvas drag lifecycle/state.
- Enhance export dialog in `src/components/2-editor/2-props/4-canvas-actions-menu.tsx` with editable/resettable export viewBox + live preview.

If you want, I can implement these remaining parity deltas as a final “strict parity” patch set in that exact order.

---

**User**

Yes, implement these remaining parity deltas.

---

**Cursor**

I’ll implement the remaining strict-parity deltas now in this order: command guards/tooltips/navigation, canvas pinch+escape-drag-cancel, then export dialog viewBox reset/live preview. I’m first reading the current versions of those files to patch precisely.

I’ve identified exactly where each delta maps in code. I’m now patching `EditorPanels` for guards/tooltips/up-down navigation first, then `PathCanvas` for pinch + drag-cancel, and finally export dialog viewBox reset/live preview.

I’ve applied the remaining delta patches. Next I’m running lint/build/tests to verify there are no regressions and to catch any typing issues from the new keyboard/touch/export logic.

Implemented the remaining parity deltas in the three target files:

- `src/components/2-editor/2-props/3-editor-panels.tsx`
- `src/components/2-editor/3-canvas/2-canvas.tsx`
- `src/components/2-editor/2-props/4-canvas-actions-menu.tsx`

### What was added

- **Command guard parity**
  - Insert/Convert menu entries are now disabled when invalid using model guards (`canInsertAfter` / `canConvert`).
  - Keyboard insert/convert shortcuts now also respect those guards before applying changes.

- **Command value tooltips**
  - Added Angular-style semantic labels (`x`, `y`, `rx`, `large-arc-flag`, etc.) via `title` on command value controls.

- **Keyboard navigation parity**
  - Added cross-row `ArrowUp` / `ArrowDown` navigation between command value controls.
  - Kept left/right intra-row navigation and improved fallback focus behavior when row schemas differ.

- **Canvas touch pinch parity**
  - Added touch gestures on canvas background:
    - one-finger touch pan
    - two-finger pinch zoom with center tracking + translation compensation
  - Kept existing mouse pan/wheel zoom behavior.

- **Escape-to-cancel-drag parity**
  - Added drag cancel handling during active drag:
    - point drag: restores pre-drag path
    - image drag: restores pre-drag image geometry/settings
  - Drag state is cleared consistently on cancel.

- **Export dialog parity improvements**
  - Added editable export `viewBox` fields (`x`, `y`, `width`, `height`).
  - Added **Reset viewBox from path bounds** button.
  - Added live SVG preview in the export dialog using current export settings.

### Verification

- `pnpm test` ✅
- `pnpm build` ✅
- `ReadLints` on changed files ✅ (no lints)

If you want, I can now do one last strict behavior-by-behavior QA script (manual test steps you can run in 5–10 minutes) to confirm these deltas in the UI.

---

**User**

Please do one last strict behavior-by-behavior QA script to confirm these deltas in the UI.

---

**Cursor**

I’ll run a strict UI QA pass and report pass/fail per behavior. First I’m checking whether a dev server is already running, then I’ll launch the app and execute the checklist in-browser against the latest changes.

Dev server is already up, so I’m running an in-browser strict QA sweep now and will return a pass/fail matrix for each delta with any caveats (e.g., touch-pinch simulation limits).

Strict QA script ready. Browser automation against `localhost` wasn’t available in this harness, so this is a **manual behavior-by-behavior verification script** with explicit pass criteria to confirm in UI.

## Setup

1. Run app: `pnpm dev`
2. Open: `http://localhost:3000`
3. In path input, paste:  
   `M 0 0 L 10 0 L 10 10 Z`
4. Click outside textarea so command rows/canvas refresh.

---

## Delta QA Checklist

### 1) Command guard disabling (menu)

- **Test 1.1 Insert After invalid types disabled**
  - Select first command row (`M`), open row `...` menu → `Insert After`.
  - **Expect:** `M`, `Z`, `T`, `S` are disabled for this context.
- **Test 1.2 Convert To invalid conversion disabled**
  - On first row (`M`), open `...` menu → `Convert To`.
  - **Expect:** conversion options are disabled for first row (no convert allowed).

### 2) Keyboard guard behavior

- **Test 2.1 Invalid insert blocked**
  - Keep first row selected.
  - Press `t`.
  - **Expect:** no new command inserted (command count unchanged).
- **Test 2.2 Invalid convert blocked**
  - Keep first row selected.
  - Press `Shift+T`.
  - **Expect:** first command type does not change.

### 3) Value tooltips on command cells

- Hover over numeric/arc controls in command rows.
- **Expect:** tooltip/title semantics like `x`, `y`, `rx`, `ry`, `large-arc-flag`, `sweep-flag`, etc.

### 4) Cross-row keyboard navigation

- Focus a numeric cell in row 2.
- Press:
  - `ArrowDown` → should move to corresponding cell in next row.
  - `ArrowUp` → should move back to previous row.
- **Expect:** row changes while staying in same column index where possible.

### 5) Escape drag-cancel behavior

- **Test 5.1 Point drag cancel**
  - Drag a canvas point to a new location (do not release immediately), press `Escape`.
  - **Expect:** path reverts to pre-drag geometry.
- **Test 5.2 Image drag cancel** (if image exists)
  - Upload image, start moving/resizing image, press `Escape`.
  - **Expect:** image returns to pre-drag position/size.

### 6) Export dialog parity (viewBox + preview)

- Open actions menu → `Export SVG`.
- **Expect all present:**
  - Editable fields: `x`, `y`, `width`, `height`
  - Button: `Reset viewBox from path bounds`
  - Live preview panel
- Modify viewBox values.
- **Expect:** live preview updates.
- Click reset.
- **Expect:** fields and preview return to path-bound-based viewBox.

### 7) Touch pinch zoom parity (device check)

- On touch device (or emulation supporting true multitouch), do two-finger pinch on empty canvas background.
- **Expect:** zoom changes smoothly around gesture center.
- If desktop only: mark **Not Testable** locally.

---

## Quick Result Template

- 1.1 ☐ Pass ☐ Fail
- 1.2 ☐ Pass ☐ Fail
- 2.1 ☐ Pass ☐ Fail
- 2.2 ☐ Pass ☐ Fail
- 3   ☐ Pass ☐ Fail
- 4   ☐ Pass ☐ Fail
- 5.1 ☐ Pass ☐ Fail
- 5.2 ☐ Pass ☐ Fail / ☐ N/A
- 6   ☐ Pass ☐ Fail
- 7   ☐ Pass ☐ Fail / ☐ Not Testable

If you run this and share failures, I can patch them immediately.

---

**User**

There should be 7 tests in total. Is that right? They all passed. Thanks

---

**Cursor**

Not quite — the **current automated suite is 5 tests total**, and they all pass.

I just re-ran it and got:

- `src/svg-core/model.test.ts`: **2 tests**
- `src/store/0-atoms/svg-path-state.test.ts`: **3 tests**
- Total: **5 passed**

The “7” was the manual parity checklist items, not test count.  
If you want, I can add **2 more Vitest cases** to bring it to 7 (e.g. export viewBox reset/live preview logic and keyboard guard behavior).

---

**User**

Great idea, let's do it.

---

**Cursor**

I’ll add 2 targeted tests to bring the suite to 7: one for command guard behavior (`canInsertAfter`/`canConvert`) and one for export viewBox reset computation. Then I’ll run the suite and confirm the new total.

Perfect — done.

You now have **7 tests total**, all passing:

- `src/svg-core/model.test.ts` → **3 tests**
- `src/store/0-atoms/svg-path-state.test.ts` → **3 tests**
- `src/components/2-editor/2-props/4-canvas-actions-menu.test.ts` → **1 test**

Total: **7 passed (7)** ✅

I added the 2 new tests for:
1. **Keyboard guard behavior backing logic** (`canInsertAfter` / `canConvert` constraints)  
2. **Export viewBox reset computation** (`computeExportViewBox`, including fallback on invalid path)



