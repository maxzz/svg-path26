import { atom } from "jotai";
import { commandRowsAtom } from "../0-atoms/2-0-svg-model";
import { selectedCommandIndexAtom, selectedCommandIndicesAtom } from "../0-atoms/2-4-0-editor-actions";

export const doSelectAllCommandsAtom = atom(
    null,
    (get, set) => {
        const rowCount = get(commandRowsAtom).length;
        if (rowCount <= 0) {
            set(selectedCommandIndicesAtom, []);
            return;
        }

        const activeIndex = get(selectedCommandIndexAtom);
        const allIndices = Array.from({ length: rowCount }, (_, i) => i);

        // Keep the “active” (last-selected) segment stable after Ctrl+A.
        if (activeIndex === null) {
            set(selectedCommandIndicesAtom, allIndices);
            return;
        }

        if (!Number.isInteger(activeIndex) || activeIndex < 0 || activeIndex >= rowCount) {
            set(selectedCommandIndicesAtom, allIndices);
            return;
        }

        set(selectedCommandIndicesAtom, allIndices.filter((it) => it !== activeIndex).concat(activeIndex));
    }
);
