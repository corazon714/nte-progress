import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { UserProfile } from "@/types";
import { loadKey, saveKey } from "@/composables/useTauriStore";

const DEFAULT: UserProfile = {
    setupComplete: false,
    region: "EU",
    hunterLevel: 1,
    tycoonLevel: 1,
    ownedCharacters: [
        { id: "esper_zero", awakening: 0 },
        { id: "chiz", awakening: 0 },
    ],
    ownedArcs: [],
    stamina: { current: 0, cap: 240 },
    spendingProfile: "F2P",
};

export const useUserStore = defineStore("user", () => {
    const profile = ref<UserProfile>({ ...DEFAULT });
    const loaded = ref(false);

    async function load() {
        const stored = await loadKey<UserProfile>("userProfile", DEFAULT);
        profile.value = { ...DEFAULT, ...stored, stamina: { ...DEFAULT.stamina, ...stored.stamina } };
        loaded.value = true;
        watch(profile, (v) => saveKey("userProfile", v), { deep: true });
    }

    function owns(charId: string): boolean {
        return profile.value.ownedCharacters.some((c) => c.id === charId);
    }

    function setOwned(charId: string, owned: boolean, awakening = 0) {
        const list = profile.value.ownedCharacters.filter((c) => c.id !== charId);
        if (owned) list.push({ id: charId, awakening });
        profile.value.ownedCharacters = list;
    }

    function setAwakening(charId: string, awakening: number) {
        const c = profile.value.ownedCharacters.find((x) => x.id === charId);
        if (c) c.awakening = Math.max(0, Math.min(6, awakening));
    }

    function reset() {
        profile.value = { ...DEFAULT };
    }

    return { profile, loaded, load, owns, setOwned, setAwakening, reset };
});
