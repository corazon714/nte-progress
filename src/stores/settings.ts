import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { SettingsState } from "@/types";
import { loadKey, saveKey } from "@/composables/useTauriStore";

const DEFAULT: SettingsState = {
    notifications: { dailyReset: true, weeklyReset: true, staminaCap: true },
    staminaWarnHours: 4,
};

export const useSettingsStore = defineStore("settings", () => {
    const state = ref<SettingsState>(structuredClone(DEFAULT));
    const loaded = ref(false);

    async function load() {
        const stored = await loadKey<SettingsState>("settings", DEFAULT);
        state.value = {
            ...DEFAULT,
            ...stored,
            notifications: { ...DEFAULT.notifications, ...(stored.notifications ?? {}) },
        };
        loaded.value = true;
        watch(state, (v) => saveKey("settings", v), { deep: true });
    }

    return { state, loaded, load };
});
