import { proxy, subscribe } from "valtio"
import type { ThemeMode } from "@/utils";

const STORE_KEY = "svg-path26"
const STORE_VER = "v1"
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`

export interface UiSettings {
    theme: ThemeMode;
    showGrid: boolean
    showHelpers: boolean
    darkCanvas: boolean
}

const DEFAULT_SETTINGS: UiSettings = {
    theme: "light",
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

export const appSettings = proxy<UiSettings>(loadSettings())

subscribe(appSettings, () => {
    try {
        localStorage.setItem(STORAGE_ID, JSON.stringify(appSettings))
    } catch (error) {
        console.error("Failed to save UI settings", error)
    }
})

export function toggleShowGrid() {
    appSettings.showGrid = !appSettings.showGrid
}

export function toggleShowHelpers() {
    appSettings.showHelpers = !appSettings.showHelpers
}

export function toggleDarkCanvas() {
    appSettings.darkCanvas = !appSettings.darkCanvas
}
