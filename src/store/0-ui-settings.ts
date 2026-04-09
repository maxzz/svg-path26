import { proxy, subscribe } from "valtio";
import { debounceDevTools, themeApplyMode } from "@/utils";
import { type UiSettings } from "./9-ui-settings-types-and-defaults";
import { normalizeStoredSettings } from "@/store/1-ui-settings-normalize";

const STORE_KEY = "svg-path26";
const STORE_VER = "v4";
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`;
const SAVE_SETTINGS_DELAY_MS = 150;

export const appSettings = proxy<UiSettings>(loadSettings());

function loadSettings(): UiSettings {
    const storedSettings = loadStoredSettings();
    const appSettingsRecord = (storedSettings as any)?.uiSettings?.appSettings ?? null;

    const rv: UiSettings = normalizeStoredSettings(appSettingsRecord);
    return rv;

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
}

themeApplyMode(appSettings.theme);

const debouncedPersistAppSettings = debounceDevTools(
    () => {
        try {
            // New format: keep the app settings under `uiSettings.appSettings` for consistency.
            localStorage.setItem(STORAGE_ID, JSON.stringify({ uiSettings: { appSettings } }));
        } catch (error) {
            console.error("Failed to save UI settings", error);
        }
    },
    SAVE_SETTINGS_DELAY_MS);

subscribe(appSettings, () => {
    try {
        themeApplyMode(appSettings.theme);
    } catch (error) {
        console.error("Failed to apply UI settings", error);
    }

    debouncedPersistAppSettings();
});
