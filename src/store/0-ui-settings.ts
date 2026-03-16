import { proxy, subscribe } from "valtio";
import { themeApplyMode } from "@/utils";
import { type UiSettings } from "./9-ui-settings-types-and-defaults";
import { normalizeStoredSettings } from "@/store/1-ui-settings-normalize";

const STORE_KEY = "svg-path26";
const STORE_VER = "v1";
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`;

function loadSettings(): UiSettings {
    return normalizeStoredSettings(loadStoredSettings());

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

export const appSettings = proxy<UiSettings>(loadSettings());

themeApplyMode(appSettings.theme);

subscribe(appSettings, () => {
    try {
        themeApplyMode(appSettings.theme);
        localStorage.setItem(STORAGE_ID, JSON.stringify(appSettings));
    } catch (error) {
        console.error("Failed to save UI settings", error);
    }
});
