import { useAtomValue } from "jotai";
import { commandCountAtom, parseErrorAtom } from "@/store/0-atoms/2-0-svg-model";

export function EditorPathStatusPanel() {
    const error = useAtomValue(parseErrorAtom);
    const commandCount = useAtomValue(commandCountAtom);

    return (
        <section className="rounded-lg border p-3">
            <h2 className="mb-2 text-sm font-semibold">
                Path Status
            </h2>
            {error ? (
                <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                    {error}
                </p>
            ) : (
                <p className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
                    Path parsed successfully.
                </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
                Commands parsed: {commandCount}
            </p>
        </section>
    );
}
