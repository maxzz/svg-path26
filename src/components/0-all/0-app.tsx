import { UISymbolDefs } from "../ui/icons/symbols";
import { Toolbar } from "../1-toolbar/1-toolbar";
import { Editor } from "../2-editor/0-all";
import { Footer } from "../3-footer/1-footer";
import { SavePathDialog } from "../4-dialogs/8-4-saved-path-save-dialog";
import { OpenPathDialog } from "../4-dialogs/8-3-saved-path-open-dialog";
import { ExportSvgDialog } from "../4-dialogs/8-1-export-svg-dialog";
import { AddImageDialog } from "../4-dialogs/8-2-add-image-dialog";
import { AboutDialog } from "../4-dialogs/8-8-about-dialog";
import { OptionsDialog } from "../4-dialogs/8-9-options-dialog";
import { ConfirmationDialog } from "../4-dialogs/confirmation/1-confirmation-dialog";

export function App() {
    return (<>
        <UISymbolDefs />

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
            <AboutDialog />
            <OptionsDialog />
        </div>
    </>);
}

//TODO: check why zooo is not working from popover, but works from canvas scroll wheel.
