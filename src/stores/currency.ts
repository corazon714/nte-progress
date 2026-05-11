import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { CurrencyState } from "@/types";
import { loadKey, saveKey } from "@/composables/useTauriStore";

const DEFAULT: CurrencyState = {
    annulith: 0,
    solidDice: 0,
    fabricatedDice: 0,
    triKey: 0,
    lostPieces: 0,
    warpPieces: 0,
    fons: 0,
    beetleCoins: 0,
    mhmCoins: 0,
    pity: { limited: 0, standard: 0, arcS: 0, arcFeatured: 0 },
    claimedCodes: {},
    incomeLog: [],
};

export const useCurrencyStore = defineStore("currency", () => {
    const state = ref<CurrencyState>(structuredClone(DEFAULT));
    const loaded = ref(false);

    async function load() {
        const stored = await loadKey<CurrencyState>("currency", DEFAULT);
        state.value = {
            ...DEFAULT,
            ...stored,
            pity: { ...DEFAULT.pity, ...(stored.pity ?? {}) },
            claimedCodes: { ...(stored.claimedCodes ?? {}) },
            incomeLog: Array.isArray(stored.incomeLog) ? [...stored.incomeLog] : [],
        };
        loaded.value = true;
        watch(state, (v) => saveKey("currency", v), { deep: true });
    }

    function setClaimed(code: string, claimed: boolean) {
        if (claimed) state.value.claimedCodes[code] = true;
        else delete state.value.claimedCodes[code];
    }

    function logIncome(weekStartIso: string, gained: number) {
        const list = state.value.incomeLog.filter((e) => e.weekStartIso !== weekStartIso);
        list.push({ weekStartIso, gained });
        list.sort((a, b) => a.weekStartIso.localeCompare(b.weekStartIso));
        // keep last 26 weeks
        state.value.incomeLog = list.slice(-26);
    }

    function removeIncome(weekStartIso: string) {
        state.value.incomeLog = state.value.incomeLog.filter((e) => e.weekStartIso !== weekStartIso);
    }

    return { state, loaded, load, setClaimed, logIncome, removeIncome };
});
