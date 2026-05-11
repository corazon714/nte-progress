import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { ChecklistState, Scope } from "@/types";
import { loadKey, saveKey } from "@/composables/useTauriStore";
import { getCycleStart } from "@/composables/useResetTimer";
import { useUserStore } from "./user";

const DEFAULT: ChecklistState = { done: {} };

function key(scope: Scope, cycleStartIso: string, taskId: string): string {
    return `${scope}:${cycleStartIso}:${taskId}`;
}

export const useChecklistStore = defineStore("checklist", () => {
    const state = ref<ChecklistState>({ ...DEFAULT });
    const loaded = ref(false);

    async function load() {
        state.value = await loadKey<ChecklistState>("checklist", DEFAULT);
        loaded.value = true;
        watch(state, (v) => saveKey("checklist", v), { deep: true });
    }

    function currentCycleIso(scope: Scope): string {
        const user = useUserStore();
        return getCycleStart(user.profile.region, scope).toISOString();
    }

    function isDone(scope: Scope, taskId: string): boolean {
        return !!state.value.done[key(scope, currentCycleIso(scope), taskId)];
    }

    function setDone(scope: Scope, taskId: string, done: boolean) {
        const k = key(scope, currentCycleIso(scope), taskId);
        if (done) state.value.done[k] = true;
        else delete state.value.done[k];
    }

    function toggle(scope: Scope, taskId: string) {
        setDone(scope, taskId, !isDone(scope, taskId));
    }

    /** Drop entries from cycles older than current to keep storage small. */
    function prune() {
        const user = useUserStore();
        const cur = {
            daily: getCycleStart(user.profile.region, "daily").toISOString(),
            weekly: getCycleStart(user.profile.region, "weekly").toISOString(),
            monthly: getCycleStart(user.profile.region, "monthly").toISOString(),
        };
        const keep: Record<string, boolean> = {};
        for (const [k, v] of Object.entries(state.value.done)) {
            const [scope, iso] = k.split(":");
            if (iso === cur[scope as Scope]) keep[k] = v;
        }
        state.value.done = keep;
    }

    return { state, loaded, load, isDone, setDone, toggle, prune };
});
