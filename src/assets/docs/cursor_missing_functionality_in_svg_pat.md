# Missing functionality in SVG path editor
_Exported on 3/7/2026 at 21:02:44 PST from Cursor (2.6.13)_

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

