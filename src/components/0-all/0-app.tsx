import { UISymbolDefs } from "../ui/icons/symbols";
import { Toolbar } from "../1-toolbar/1-toolbar";
import { Editor } from "../2-editor/0-all";
import { Footer } from "../3-footer/1-footer";
import { SavePathDialog } from "../4-dialogs/2-saved-saved/0-saved-path-save-dialog";
import { OpenPathDialog } from "../4-dialogs/1-open-saved/0-saved-path-open-dialog";
import { ExportSvgDialog } from "../4-dialogs/5-export-path/0-export-svg-dialog";
import { AddImageDialog } from "../4-dialogs/6-add-image/0-add-image-dialog";
import { AboutDialog } from "../4-dialogs/8-2-about/0-about-dialog";
import { OptionsDialog } from "../4-dialogs/8-3-options/0-options-dialog";
import { ConfirmationDialog } from "../4-dialogs/8-1-confirmation/0-confirmation-dialog";
import { ScaleDialog } from "../4-dialogs/9-scale/0-scale-dialog";

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
            <ScaleDialog />
        </div>
    </>);
}

//TODO: check why zooo is not working from popover, but works from canvas scroll wheel.
