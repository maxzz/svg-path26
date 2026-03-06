import { proxy } from "valtio"

export const uiSettings = proxy({
    showGrid: true,
    showHelpers: true,
    darkCanvas: false,
})

export function toggleShowGrid() {
    uiSettings.showGrid = !uiSettings.showGrid
}

export function toggleShowHelpers() {
    uiSettings.showHelpers = !uiSettings.showHelpers
}

export function toggleDarkCanvas() {
    uiSettings.darkCanvas = !uiSettings.darkCanvas
}
