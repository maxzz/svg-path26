import { atomWithStorage } from "jotai/utils";

const DEFAULT_PATH = "M 20 140 C 40 20, 65 20, 95 140 S 150 260, 180 140";

export const rawPathAtom = atomWithStorage("svg-path26:path", DEFAULT_PATH);
