import { useCallback, useEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/0-ui-settings";
import { Accordion } from "@/components/ui/shadcn/accordion";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { SectionPanel } from "@/components/ui/local-ui/1-section-panel.tsx";
import { type SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
import { commandRowsAtom, subPathAccordionValuesAtom, subPathsAtom } from "@/store/0-atoms/2-0-svg-model";
import { doSelectCommandAtom, doToggleSegmentRelativeAtom, hoveredCommandIndexAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-4-0-editor-actions.ts";
import { canvasDragStateAtom } from "@/components/2-editor/3-canvas/3-canvas-drag";
import { CommandRow, focusField } from "./1-1-row.tsx";
import { PathCommands_Label, PathCommands_Overlay } from "./7-1-overlays.tsx";
import { SubPathToggleRow } from "./7-2-row-subpath-header.tsx";

export function Section_PathCommands() {
    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel label={<PathCommands_Label />} sectionKey="commands" contentClassName="px-0 pt-0.5 pb-4" overlay={<PathCommands_Overlay />}>

                {/* The ScrollArea viewport was still using h-full, which needs a definite parent height; max-h-64 on the root doesn’t give it one, 
                so the viewport expands with content and never overflows (no scrollbars, no wheel scroll). I moved the height constraint to the viewport and
                overrode h-full with h-auto. This restores hover scrollbars and wheel scrolling while keeping the “auto up to max height” behavior. */}
                <ScrollArea className="mr-1 bg-muted/20 border rounded" viewportClassName="h-auto max-h-64" fixedWidth parentContentWidth>
                    <div className="px-1 py-2 text-xs font-ui">
                        <CommandsList />
                    </div>
                </ScrollArea>

            </SectionPanel>
        </TooltipProvider>
    );
}

export function CommandsList() {
    const rows = useAtomValue(commandRowsAtom);
    const subPaths = useAtomValue(subPathsAtom);
    const [openSubPaths, setOpenSubPaths] = useAtom(subPathAccordionValuesAtom);

    const setSelectedCommandIndex = useSetAtom(selectedCommandIndexAtom);
    
    const doSelectCommand = useSetAtom(doSelectCommandAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const doToggleRelative = useSetAtom(doToggleSegmentRelativeAtom);

    const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const focusCell = useCallback(
        (rowIndex: number, valueIndex: number) => {
            focusField(rows, rowRefs.current, fieldRefs.current, rowIndex, valueIndex, setSelectedCommandIndex);
        },
        [rows, setSelectedCommandIndex]);

    const moveVertical = useCallback(
        (rowIndex: number, valueIndex: number, direction: "up" | "down") => {
            const nextRowIndex = direction === "up" ? rowIndex - 1 : rowIndex + 1;
            if (nextRowIndex < 0 || nextRowIndex >= rows.length) {
                return;
            }
            setSelectedCommandIndex(nextRowIndex);
            focusCell(nextRowIndex, valueIndex);
        },
        [rows.length, focusCell, setSelectedCommandIndex]);

    const registerFieldRef = useCallback(
        (rowIndex: number, valueIndex: number, element: HTMLInputElement | null) => {
            fieldRefs.current[`${rowIndex}:${valueIndex}`] = element;
        },
        []);

    const setRowRef = useCallback(
        (rowIndex: number, element: HTMLDivElement | null) => {
            rowRefs.current[rowIndex] = element;
        },
        []);

    if (rows.length === 0) {
        return (
            <p className="text-muted-foreground">No commands to show.</p>
        );
    }

    function renderRow(row: SvgSegmentSummary) {
        return (
            <CommandRow
                key={row.index}
                row={row}
                setRowRef={setRowRef}
                
                doSelectCommand={doSelectCommand}
                setHoveredCommandIndex={setHoveredCommandIndex}
                doToggleRelative={doToggleRelative}

                focusCell={focusCell}
                moveVertical={moveVertical}
                registerFieldRef={registerFieldRef} />
        );
    }

    const hasCompoundSubPaths = subPaths.length > 1;

    return (<>
        <CommandsListScrollEffects rowRefs={rowRefs} rowsLength={rows.length} />

        {hasCompoundSubPaths
            ? (<>
                <Accordion type="multiple" value={openSubPaths} onValueChange={setOpenSubPaths}>
                    {subPaths.map(
                        (subPath) => (
                            <SubPathToggleRow key={`subpath:${subPath.index}`} subPathIndex={subPath.index}>
                                {rows
                                    .filter((row) => row.index >= subPath.startIndex && row.index <= subPath.endIndex)
                                    .map(renderRow)
                                }
                            </SubPathToggleRow>
                        )
                    )}
                </Accordion>
            </>)
            : rows.map(renderRow)
        }
    </>);
}

function CommandsListScrollEffects({ rowRefs, rowsLength }: { rowRefs: React.RefObject<Record<number, HTMLDivElement | null>>; rowsLength: number; }) {
    const { scrollOnHover } = useSnapshot(appSettings.canvas);

    const selectedCommandIndex = useAtomValue(selectedCommandIndexAtom);
    const hoveredCommandIndex = useAtomValue(hoveredCommandIndexAtom);
    const dragState = useAtomValue(canvasDragStateAtom);

    useEffect(
        () => {
            if (selectedCommandIndex === null) return;
            if (dragState?.mode === "marquee") return;
            rowRefs.current[selectedCommandIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", });
        },
        [dragState, rowRefs, rowsLength, selectedCommandIndex]);

    useEffect(
        () => {
            if (!scrollOnHover) return;
            if (hoveredCommandIndex === null || hoveredCommandIndex === selectedCommandIndex) return;
            rowRefs.current[hoveredCommandIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        },
        [hoveredCommandIndex, rowRefs, rowsLength, scrollOnHover, selectedCommandIndex]);

    return null;
}
