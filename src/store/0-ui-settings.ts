import { proxy, subscribe } from "valtio";
import { debounceDevTools, themeApplyMode } from "@/utils";
import { type UiSettings } from "./9-ui-settings-types-and-defaults";
import { normalizeStoredSettings } from "@/store/1-ui-settings-normalize";

const STORE_KEY = "svg-path26";
const STORE_VER = "v3";
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`;
const SAVE_SETTINGS_DELAY_MS = 150;

function loadSettings(): UiSettings {
    const storedSettings = loadStoredSettings();
    const extractedAppSettings = unwrapStoredSettings(storedSettings);
    return normalizeStoredSettings(extractedAppSettings);

    function loadStoredSettings(): unknown {
        try {
            const raw = localStorage.getItem(STORAGE_ID);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (error) {
            console.error("Failed to load UI settings", error);
        }

        return null;
    }

    function unwrapStoredSettings(value: unknown): unknown {
        if (!value || typeof value !== "object") return value;

        const record = value as Record<string, unknown>;
        const uiSettings = record.uiSettings as Record<string, unknown> | undefined;
        const wrappedAppSettings = uiSettings?.appSettings;

        // New format: { uiSettings: { appSettings: ... } }
        if (wrappedAppSettings) return wrappedAppSettings;

        // Backwards compatibility: allow { appSettings: ... } or the legacy direct object shape.
        const legacyAppSettings = record.appSettings;
        if (legacyAppSettings) return legacyAppSettings;

        return value;
    }
}

export const appSettings = proxy<UiSettings>(loadSettings());

themeApplyMode(appSettings.theme);

const persistAppSettings = debounceDevTools(() => {
    try {
        // New format: keep the app settings under `uiSettings.appSettings` for consistency.
        localStorage.setItem(STORAGE_ID, JSON.stringify({ uiSettings: { appSettings } }));
    } catch (error) {
        console.error("Failed to save UI settings", error);
    }
}, SAVE_SETTINGS_DELAY_MS);

subscribe(appSettings, () => {
    try {
        themeApplyMode(appSettings.theme);
    } catch (error) {
        console.error("Failed to apply UI settings", error);
    }

    persistAppSettings();
});
