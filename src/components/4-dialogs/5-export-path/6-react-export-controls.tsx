import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select";
import { appSettings } from "@/store/0-ui-settings";
import { doSetExportAsReactComponentAtom, doSetReactComponentGeneratorAtom, exportReactComponentErrorAtom, exportReactComponentNoticeAtom } from "./8-dialog-export-atoms";

export function ReactExportControls() {
    const { exportAsReactComponent, reactComponentGenerator } = useSnapshot(appSettings.export);
    const reactExportError = useAtomValue(exportReactComponentErrorAtom);
    const reactExportNotice = useAtomValue(exportReactComponentNoticeAtom);

    const setExportAsReactComponent = useSetAtom(doSetExportAsReactComponentAtom);
    const setReactComponentGenerator = useSetAtom(doSetReactComponentGeneratorAtom);

    return (
        <div className="px-2 py-1.5 border rounded grid gap-2 select-none">
            <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                    className="size-3.5"
                    checked={exportAsReactComponent}
                    onCheckedChange={(checked) => setExportAsReactComponent(checked === true)}
                />
                <span>
                    Export as React component
                </span>
            </label>

            {exportAsReactComponent && (
                <label className="grid gap-1.5 text-[11px]">
                    <span className="text-muted-foreground">
                        Generator
                    </span>
                    <Select value={reactComponentGenerator} onValueChange={(value) => setReactComponentGenerator(value === "markup" ? "markup" : "template")}>
                        <SelectTrigger className="h-6! w-full text-[11px]">
                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="template">Option 1: Local template emitter</SelectItem>
                            <SelectItem value="markup">Option 4: Local markup parser</SelectItem>
                        </SelectContent>
                    </Select>
                </label>
            )}

            {reactExportNotice && (
                <p className="text-[11px] leading-4 text-muted-foreground">
                    {reactExportNotice}
                </p>
            )}

            {reactExportError && (
                <p className="text-[11px] leading-4 text-destructive">
                    {reactExportError}
                </p>
            )}
        </div>
    );
}