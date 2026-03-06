import { proxy, subscribe } from "valtio"

const STORE_KEY = "svg-path26"
const STORE_VER = "v1"
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`

export interface UiSettings {
    showGrid: boolean
    showHelpers: boolean
    darkCanvas: boolean
}

const DEFAULT_SETTINGS: UiSettings = {
    showGrid: true,
    showHelpers: true,
    darkCanvas: false,
}

function loadSettings(): UiSettings {
    try {
        const stored = localStorage.getItem(STORAGE_ID)
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
        }
    } catch (error) {
        console.error("Failed to load UI settings", error)
    }
    return { ...DEFAULT_SETTINGS }
}

export const uiSettings = proxy<UiSettings>(loadSettings())

subscribe(uiSettings, () => {
    try {
        localStorage.setItem(STORAGE_ID, JSON.stringify(uiSettings))
    } catch (error) {
        console.error("Failed to save UI settings", error)
    }
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
