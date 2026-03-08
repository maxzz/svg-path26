import { UISymbolDefs } from "../ui/icons/symbols";
import { Toolbar } from "../1-toolbar/1-toolbar";
import { Editor } from "../2-editor/0-all";
import { Footer } from "../3-footer/1-footer";

export function App() {
    return (<>
        <UISymbolDefs />
        
        <div className="h-screen w-screen text-foreground bg-background overflow-hidden">
            <div className="mx-auto max-w-6xl h-full flex flex-col">
                <Toolbar />
                <Editor />
                <Footer />
            </div>
        </div>
    </>);
}
