## Plan: Selection Rerender Reduction

Reduce rerenders caused by point selection from either the canvas or the path commands list by narrowing React work to the affected rows/points only, while keeping current selection semantics intact. Recommended approach: split the hottest mapped UI into memoized row/point components, move broad selection/hover subscriptions out of full-list render loops where practical, and reuse already-derived geometry atoms instead of recomputing line maps from point relations.

**Steps**
1. Baseline the current selection fan-out in the canvas and commands list by tracing every subscriber of `selectedCommandIndexAtom`, `hoveredCommandIndexAtom`, `hoveredCanvasPointAtom`, and `draggedCanvasPointAtom`. Confirm which rerenders are required UI updates versus incidental full-list/full-overlay rerenders.
2. Phase 1: shrink the canvas rerender surface in [c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/3-canvas/1-overlays/3-control-points-and-lines.tsx] — extract memoized presentational units for control points and control lines so selection/hover changes only rerender the previously active and newly active items. Reuse stable geometry objects from `controlPointsAtom`/`controlLinesAtom` and keep drag handlers/setters outside per-item recreation where possible.
3. Phase 1: apply the same pattern to [c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/3-canvas/1-overlays/5-target-points.tsx] because target-point selection shares the same `selectedCommandIndexAtom` and hover subscriptions and would otherwise remain a large rerender source. This can run in parallel with step 2 once the memoization shape is defined.
4. Phase 1.5: review [c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/3-canvas/1-overlays/4-canvas-segment-overlays.tsx] and [c:/y/w/2-web/0-stack/2-editors/svg-path26/src/store/0-atoms/2-2-editor-actions.ts] to ensure selected/hovered segment overlay subscriptions stay isolated to the single active path overlay and do not accidentally force broader overlay rerenders. Only adjust derived atoms if profiling shows array recreation or avoidable dependency breadth.
5. Phase 2: shrink commands-list rerenders in [c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/2-panel-commands/2-0-commands-list.tsx] by extracting a memoized row component. Pass each row only its row data plus booleans for selected, hovered, and point-linked highlighting so a selection change rerenders only the affected rows instead of the full list.
6. Phase 2: isolate per-cell work in [c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/2-panel-commands/2-1-commands-list-cells.tsx]. Preserve local draft state, but avoid parent-driven rerenders from unrelated row changes by keeping cell props minimal and stable. Ensure focus-driven `setSelectedCommandIndex` still works without re-rendering unrelated rows.
7. Phase 3: if memoization alone is insufficient, introduce finer-grained derived selection helpers in [c:/y/w/2-web/0-stack/2-editors/svg-path26/src/store/0-atoms/2-2-editor-actions.ts] or lightweight wrapper components so individual rows/points subscribe to their own selection state instead of broad top-level components subscribing and recalculating full maps. This step depends on profiling after steps 2, 3, 5, and 6.
8. Keep hover/focus optimization in scope alongside selection because the current rerender hotspots are shared across `selectedCommandIndexAtom`, `hoveredCommandIndexAtom`, and `hoveredCanvasPointAtom`. Do not change path parsing/model update semantics, drag history behavior, or visual selection behavior.

**Relevant files**
- `c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/3-canvas/1-overlays/3-control-points-and-lines.tsx` — current full-map rerender hotspot for control points and dashed control lines.
- `c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/3-canvas/1-overlays/5-target-points.tsx` — parallel hotspot for target point selection/hover rendering.
- `c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/3-canvas/1-overlays/4-canvas-segment-overlays.tsx` — selected/hovered segment overlays; confirm subscription isolation.
- `c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/2-panel-commands/2-0-commands-list.tsx` — full command list rerenders on selection/hover/highlight updates.
- `c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/2-panel-commands/2-1-commands-list-cells.tsx` — focus and edit cells that currently bubble selection updates through the parent list.
- `c:/y/w/2-web/0-stack/2-editors/svg-path26/src/store/0-atoms/2-2-editor-actions.ts` — selection/hover atoms and derived selected/hovered segment atoms.
- `c:/y/w/2-web/0-stack/2-editors/svg-path26/src/store/0-atoms/2-0-svg-model.ts` — geometry atoms including `controlPointsAtom`, `targetPointsAtom`, `controlLinesAtom`, and `standaloneSegmentPathsAtom`.

**Verification**
1. Use React DevTools Profiler or temporary render counters to compare before/after when: selecting a control point on canvas, selecting a target point on canvas, clicking a command row, focusing a command input, and moving hover between points/rows.
2. Confirm only the previously active and newly active command rows rerender on selection changes; unrelated rows should remain stable.
3. Confirm only the affected point/line/halo elements rerender on canvas selection or hover changes; geometry-wide rerenders should occur only when the path/zoom actually changes.
4. Manually test drag start from a selected point to ensure drag still seeds history correctly and selection still synchronizes to the commands list.
5. Run the project’s relevant tests or at minimum the existing atom/svg-model tests plus a build to verify no behavioral regressions.

**Decisions**
- Include hover/focus rerender reduction together with selection rerender reduction because the same top-level subscriptions currently drive both costs.
- Prefer minimal-risk component extraction and memoization first; only add finer-grained selection atoms if profiling shows remaining broad rerenders.
- Reuse existing geometry derivations such as `controlLinesAtom` rather than calculating line elements by traversing `point.relations` inside render.

**Further Considerations**
1. If row/point object identity is not stable enough across renders, memoization should compare only the primitive props that affect paint rather than relying on object reference equality.
2. If selection scroll behavior causes avoidable work, consider limiting smooth-scroll effects to actual row changes rather than every hover transition, but keep this as a secondary optimization after render-surface reduction.
3. If profiling shows Valtio `useSnapshot(appSettings.canvas)` invalidates too much canvas UI, isolate `darkCanvas` reads into smaller wrapper components after the main selection optimizations land.
