import { UISymbolDefs } from "../ui/icons/symbols";
import { Toolbar } from "../1-toolbar/1-toolbar";
import { Editor } from "../2-editor/0-all";
import { Footer } from "../3-footer/1-footer";
import { SavePathDialog } from "../4-dialogs/2-saved-saved/0-saved-path-save-dialog";
import { OpenPathDialog } from "../4-dialogs/1-open-saved/0-saved-path-open-dialog";
import { ExportSvgDialog } from "../4-dialogs/5-export-path/0-export-svg-dialog";
import { AddImageDialog } from "../4-dialogs/6-add-image/0-add-image-dialog";
import { ScaleToViewBoxDialog } from "../4-dialogs/7-scale-to-viewbox/0-scale-to-viewbox-dialog";
import { AboutDialog } from "../4-dialogs/8-2-about/0-about-dialog";
import { OptionsDialog } from "../4-dialogs/8-3-options/0-options-dialog";
import { ConfirmationDialog } from "../4-dialogs/8-1-confirmation/0-confirmation-dialog";
import { UpdateViewBoxDialog } from "../4-dialogs/9-update-view-box/0-update-view-box-dialog";
import { Toaster as SonnerToaster } from "sonner";

export function App() {
    return (<>
        <UISymbolDefs />
        <SonnerToaster />

        <div className="h-screen w-screen text-foreground bg-background overflow-hidden">
            <div className="h-full flex flex-col">
                <Toolbar />
                <Editor />
                <Footer />
            </div>

            <SavePathDialog />
            <ConfirmationDialog />
            <OpenPathDialog />
            <ExportSvgDialog />
            <AddImageDialog />
            <ScaleToViewBoxDialog />
            <UpdateViewBoxDialog />
            <AboutDialog />
            <OptionsDialog />
        </div>
    </>);
}

//TODO: check why zooo is not working from popover, but works from canvas scroll wheel.
