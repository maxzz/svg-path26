import { atom } from "jotai";

export type EditorImage = {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    preserveAspectRatio: boolean;
    opacity: number;
    data: string;
};

export type PendingImage = Omit<EditorImage, "id">;

export const pendingImageAtom = atom<PendingImage | null>(null);

export const isImageEditModeAtom = atom(false);
export const imagesAtom = atom<EditorImage[]>([]);
export const focusedImageIdAtom = atom<string | null>(null);

export const doAddImageAtom = atom(
    null,
    (_get, set, image: Omit<EditorImage, "id">) => {
        const id = `im:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
        set(imagesAtom, (previous) => [...previous, { ...image, id }]);
        set(focusedImageIdAtom, id);
        set(isImageEditModeAtom, true);
    }
);

export const doUpdateImageAtom = atom(
    null,
    (_get, set, args: { id: string; patch: Partial<EditorImage>; }) => {
        set(imagesAtom, (previous) => previous.map((it) => it.id === args.id ? { ...it, ...args.patch } : it));
    }
);

export const doDeleteImageAtom = atom(
    null,
    (get, set, id: string) => {
        set(imagesAtom, get(imagesAtom).filter((it) => it.id !== id));
        if (get(focusedImageIdAtom) === id) {
            set(focusedImageIdAtom, null);
        }
    }
);
