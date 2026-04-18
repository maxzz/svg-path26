import { useCallback, useEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Accordion } from "@/components/ui/shadcn/accordion";
import { TooltipProvider } from "@/components/ui/shadcn/tooltip";
import { SectionPanel } from "@/components/ui/loacal-ui/1-section-panel.tsx";
import { type SvgSegmentSummary } from "@/svg-core/9-types-svg-model";
import { commandRowsAtom, subPathAccordionValuesAtom, subPathsAtom } from "@/store/0-atoms/2-0-svg-model";
import { doSelectCommandAtom, doToggleSegmentRelativeAtom, hoveredCommandIndexAtom, selectedCommandIndexAtom } from "@/store/0-atoms/2-4-0-editor-actions.ts";
import { appSettings } from "@/store/0-ui-settings";
import { canvasDragStateAtom } from "@/components/2-editor/3-canvas/3-canvas-drag";
import { PathCommandsOverlay } from "./7-1-overlay-buttons.tsx";
import { SubPathToggleRow } from "./7-2-subpath-header.tsx";
import { CommandRow, focusField } from "./1-commands-list-row.tsx";

export function Section_PathCommands() {
    return (
        <TooltipProvider delayDuration={250}>
            <SectionPanel
                sectionKey="commands"
                label="Path Commands"
                contentClassName="px-0 pt-0.5 pb-4"
                overlay={<PathCommandsOverlay />}
            >
                <div className="px-1 py-2 max-h-64 text-xs font-ui border bg-muted/20 rounded overflow-auto">
                    <CommandsList />
                </div>
            </SectionPanel>
        </TooltipProvider>
    );
}

export function CommandsList() {
    const rows = useAtomValue(commandRowsAtom);
    const subPaths = useAtomValue(subPathsAtom);
    const setSelectedCommandIndex = useSetAtom(selectedCommandIndexAtom);
    const doSelectCommand = useSetAtom(doSelectCommandAtom);
    const setHoveredCommandIndex = useSetAtom(hoveredCommandIndexAtom);
    const doToggleRelative = useSetAtom(doToggleSegmentRelativeAtom);
    const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [openSubPaths, setOpenSubPaths] = useAtom(subPathAccordionValuesAtom);
    const hasCompoundSubPaths = subPaths.length > 1;

    const moveVertical = useCallback(
        (rowIndex: number, valueIndex: number, direction: "up" | "down") => {
            const nextRowIndex = direction === "up" ? rowIndex - 1 : rowIndex + 1;
            if (nextRowIndex < 0 || nextRowIndex >= rows.length) return;

            setSelectedCommandIndex(nextRowIndex);
            focusCommandCell(nextRowIndex, valueIndex);
        },
        [rows.length, setSelectedCommandIndex]);

    const focusCommandCell = useCallback(
        (nextRowIndex: number, nextValueIndex: number) => {
            focusField(rows, rowRefs.current, fieldRefs.current, nextRowIndex, nextValueIndex, setSelectedCommandIndex);
        },
        [rows, setSelectedCommandIndex]);

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
        return <p className="text-muted-foreground">No commands to show.</p>;
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
                focusCommandCell={focusCommandCell}
                moveVertical={moveVertical}
                registerFieldRef={registerFieldRef} />
        );
    }

    return (<>
        <CommandsListScrollEffects rowRefs={rowRefs} rowsLength={rows.length} />
        {hasCompoundSubPaths
            ? (<>
                <Accordion
                    type="multiple"
                    value={openSubPaths}
                    onValueChange={setOpenSubPaths}
                >
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

function CommandsListScrollEffects(props: { rowRefs: React.RefObject<Record<number, HTMLDivElement | null>>; rowsLength: number; }) {
    const { rowRefs, rowsLength } = props;
    const selectedCommandIndex = useAtomValue(selectedCommandIndexAtom);
    const hoveredCommandIndex = useAtomValue(hoveredCommandIndexAtom);
    const dragState = useAtomValue(canvasDragStateAtom);
    const { scrollOnHover } = useSnapshot(appSettings.canvas);

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

