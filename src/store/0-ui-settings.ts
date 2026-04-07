import { proxy, subscribe } from "valtio";
import { debounceDevTools, themeApplyMode } from "@/utils";
import { type UiSettings } from "./9-ui-settings-types-and-defaults";
import { normalizeStoredSettings } from "@/store/1-ui-settings-normalize";
import { type DialogsUiSettings, DEFAULT_DIALOGS_UI_SETTINGS, normalizeDialogsUiSettings } from "./10-dialogs-ui-settings-types-and-defaults";

const STORE_KEY = "svg-path26";
const STORE_VER = "v4";
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`;
const SAVE_SETTINGS_DELAY_MS = 150;

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

function loadAppSettings(): UiSettings {
    const storedSettings = loadStoredSettings();
    const appSettingsRecord = (storedSettings as any)?.uiSettings?.appSettings ?? null;
    return normalizeStoredSettings(appSettingsRecord);
}

function loadDialogsSettings(): DialogsUiSettings {
    const storedSettings = loadStoredSettings();
    const dialogsRecord = (storedSettings as any)?.uiSettings?.dialogs ?? null;
    return normalizeDialogsUiSettings(dialogsRecord) ?? DEFAULT_DIALOGS_UI_SETTINGS;
}

export const appSettings = proxy<UiSettings>(loadAppSettings());
export const dialogsSettings = proxy<DialogsUiSettings>(loadDialogsSettings());

themeApplyMode(appSettings.theme);

const persistUiSettings = debounceDevTools(() => {
    try {
        // New format: keep the app settings under `uiSettings.appSettings` for consistency.
        localStorage.setItem(STORAGE_ID, JSON.stringify({ uiSettings: { appSettings, dialogs: dialogsSettings } }));
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

    persistUiSettings();
});

subscribe(dialogsSettings, () => {
    persistUiSettings();
});
