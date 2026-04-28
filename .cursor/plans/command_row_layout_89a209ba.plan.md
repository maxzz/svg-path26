---
name: Command Row Layout
overview: Update path command rows so the command cell stretches to the full row height while value cells render in a fixed-width grid that keeps X/Y pairs together when wrapping.
todos:
  - id: row-layout
    content: Switch row/value container to stretch + grid layout.
    status: completed
  - id: cell-widths
    content: Adjust value/flag cell widths for grid sizing.
    status: completed
  - id: pair-groups
    content: Add grouped rendering for coordinate pairs and arcs.
    status: completed
isProject: false
---

# Command Row Cell Layout

## Proposed Solution
- Switch the value-cell container from flex-wrap to a fixed-column CSS grid so each cell keeps a uniform width and wraps cleanly by column count.
- Render value cells in grouped grid items so coordinate pairs (and arc rx/ry + x/y) wrap as a unit.
- Allow the command cell to stretch with the row height by removing the fixed height and using stretch alignment + inner centering.

## Key Context
- Row layout and value container are defined in:
  - [c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/4-section-path-commands/1-1-row.tsx](c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/4-section-path-commands/1-1-row.tsx)
```31:71:c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/4-section-path-commands/1-1-row.tsx
    return (
        <div
            ref={(element) => { setRowRef(row.index, element); }}
            className={getRowClassName(selected, hovered, isCanvasPointFocused)}
            onClick={(event) => doSelectCommand({ index: row.index, mode: getCommandSelectionMode(event) })}
            onMouseEnter={() => setHoveredCommandIndex(row.index)}
            onMouseLeave={() => setHoveredCommandIndex(null)}
        >
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className={getRowCommandClassName(row.command === row.command.toLowerCase(), highlightCommandCell)}
                        onClick={(event) => {
                            event.stopPropagation();
                            doSelectCommand({ index: row.index, mode: "replace" });
                            doToggleRelative(row.index);
                        }}
                        type="button"
                    >
                        {row.command}
                    </button>
                </TooltipTrigger>
                /* ... */
            </Tooltip>

            <div className="min-w-0 font-mono text-right flex items-center flex-wrap gap-0.5">
                {row.values.length === 0 && (
                    <span className="text-[10px] text-muted-foreground">No values</span>
                )}

                <RowValues
                    row={row}
                    highlightedCanvasPoint={highlightedCanvasPoint}
                    focusCell={focusCell}
                    moveVertical={moveVertical}
                    registerFieldRef={registerFieldRef}
                />
            </div>
            /* ... */
        </div>
    );
```
- Value cell rendering and arc-flag grouping are in:
  - [c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/4-section-path-commands/1-2-row-values.tsx](c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/4-section-path-commands/1-2-row-values.tsx)
  - [c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/4-section-path-commands/1-3-row-cells.tsx](c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/4-section-path-commands/1-3-row-cells.tsx)
  - [c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/4-section-path-commands/1-4-row-cell-input.tsx](c:/y/w/2-web/0-stack/2-editors/svg-path26/src/components/2-editor/2-props/4-section-path-commands/1-4-row-cell-input.tsx)

## Plan
- Update row and command-cell alignment in `1-1-row.tsx`:
  - Change the row wrapper to allow stretch (e.g., `items-stretch`) and/or use `self-stretch` on the command button so it grows with a multi-line row.
  - Remove the fixed command button height, replace with `h-auto`/`min-h-5`, and add `flex items-center justify-center` to keep the glyph centered.
  - Convert the values container to a grid like `grid grid-cols-[repeat(auto-fill,_2.4rem)] gap-0.5` and add `flex-1 min-w-0` so it occupies remaining width between command and menu.
  - Ensure the “No values” label spans the grid (`col-span-full`).
- Update value-cell sizing for the grid:
  - In `1-4-row-cell-input.tsx` and `1-3-row-cells.tsx`, remove `flex-1` and switch to `w-full` (or `min-w-[2.4rem]`) so the grid column controls the width.
- Group value cells so coordinate pairs wrap together (per your selected rules):
  - In `1-2-row-values.tsx`, build a `getValueGroups(row)` helper that returns group descriptors.
  - For arc commands (`A/a`), emit groups: `[0,1]` (rx/ry), `[2]` (rotation), `[flags]` (valueIndex 3+4 via `CellArcFlagsInput`), `[5,6]` (x/y).
  - For other commands, group values into pairs of two (x/y, control x/y) and keep single-value commands (`H/V`) as single groups.
  - Render pair groups as grid items with `col-span-2` and an inner `grid grid-cols-2 gap-0.5` so both inputs stay on the same wrapped line.

## Test Plan
- Resize the panel to force wrapping and confirm:
  - Command cell matches the full row height for wrapped rows.
  - Value cells keep the fixed width on each line.
  - Paired values (rx/ry and x/y for arcs; x/y or control pairs for others) move together when wrapping.

