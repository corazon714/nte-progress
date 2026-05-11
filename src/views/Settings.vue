<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useSettingsStore } from "@/stores/settings";
import { useChecklistStore } from "@/stores/checklist";
import { useCurrencyStore } from "@/stores/currency";
import GlassPanel from "@/components/GlassPanel.vue";
import type { Region } from "@/types";
import { downloadBackup, importFromFile, SCHEMA_VERSION } from "@/composables/useBackup";

const router = useRouter();
const user = useUserStore();
const settings = useSettingsStore();
const checklist = useChecklistStore();
const currency = useCurrencyStore();

const regions: Region[] = ["EU", "Asia", "US"];
const confirming = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const importStatus = ref<{ kind: "ok" | "err"; msg: string } | null>(null);

function rerunSetup() {
    user.profile.setupComplete = false;
    router.push({ name: "setup" });
}

function resetAll() {
    user.reset();
    checklist.state.done = {};
    Object.assign(currency.state, {
        annulith: 0, solidDice: 0, fabricatedDice: 0, triKey: 0,
        lostPieces: 0, warpPieces: 0, fons: 0, beetleCoins: 0, mhmCoins: 0,
        pity: { limited: 0, standard: 0, arcS: 0, arcFeatured: 0 },
        claimedCodes: {},
        incomeLog: [],
    });
    confirming.value = false;
    router.push({ name: "setup" });
}

async function onExport() {
    try {
        await downloadBackup();
        importStatus.value = { kind: "ok", msg: "Backup downloaded." };
    } catch (e) {
        importStatus.value = { kind: "err", msg: (e as Error).message };
    }
}

async function onImportFile(ev: Event) {
    const target = ev.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
        const n = await importFromFile(file);
        importStatus.value = { kind: "ok", msg: `Imported ${n} section(s). Reloading…` };
        // Reload to re-initialize stores from disk.
        setTimeout(() => window.location.reload(), 600);
    } catch (e) {
        importStatus.value = { kind: "err", msg: (e as Error).message };
    } finally {
        target.value = "";
    }
}
</script>

<template>
    <div class="space-y-5 max-w-3xl">
        <header>
            <h1 class="font-display text-3xl">Settings</h1>
            <p class="text-sm text-nte-muted">Region, notifications, and data management.</p>
        </header>

        <GlassPanel title="Region">
            <div class="flex gap-2">
                <button v-for="r in regions" :key="r" class="btn"
                    :class="user.profile.region === r ? 'btn-primary' : 'btn-ghost'" @click="user.profile.region = r">{{
                        r }}</button>
            </div>
            <p class="text-xs text-nte-muted mt-2">
                Daily/weekly/monthly countdowns recompute instantly when you change this.
            </p>
        </GlassPanel>

        <GlassPanel title="Notifications">
            <label class="flex items-center justify-between py-2 border-b border-nte-border/40">
                <span>Daily reset (1h before)</span>
                <input type="checkbox" class="accent-nte-violet" v-model="settings.state.notifications.dailyReset" />
            </label>
            <label class="flex items-center justify-between py-2 border-b border-nte-border/40">
                <span>Weekly reset (6h before)</span>
                <input type="checkbox" class="accent-nte-violet" v-model="settings.state.notifications.weeklyReset" />
            </label>
            <label class="flex items-center justify-between py-2">
                <span>Stamina cap warning</span>
                <input type="checkbox" class="accent-nte-violet" v-model="settings.state.notifications.staminaCap" />
            </label>
            <div class="mt-3">
                <label class="block text-xs uppercase tracking-wider text-nte-muted mb-1">
                    Warn me {{ settings.state.staminaWarnHours }}h before stamina caps
                </label>
                <input type="range" min="1" max="12" step="1" v-model.number="settings.state.staminaWarnHours"
                    class="w-full accent-nte-cyan" />
            </div>
        </GlassPanel>

        <GlassPanel title="Backup & restore"
            subtitle="Export your progress to a JSON file, or restore from a previous backup.">
            <div class="flex flex-wrap gap-2">
                <button class="btn btn-primary" @click="onExport">Export backup…</button>
                <button class="btn btn-ghost" @click="fileInput?.click()">Import backup…</button>
                <input ref="fileInput" type="file" accept="application/json,.json" class="hidden"
                    @change="onImportFile" />
            </div>
            <p v-if="importStatus" class="mt-3 text-sm"
                :class="importStatus.kind === 'ok' ? 'text-nte-cyan' : 'text-nte-rose'">
                {{ importStatus.msg }}
            </p>
            <p class="text-[11px] text-nte-muted mt-2">
                Schema v{{ SCHEMA_VERSION }} · Includes profile, currencies + income log, checklists, settings.
                Importing overwrites all local data and reloads the app.
            </p>
        </GlassPanel>

        <GlassPanel title="Profile">
            <div class="flex gap-2 flex-wrap">
                <button class="btn btn-ghost" @click="rerunSetup">Re-run setup wizard</button>
                <button v-if="!confirming" class="btn btn-ghost text-nte-rose border-nte-rose/40"
                    @click="confirming = true">
                    Reset all data…
                </button>
                <template v-else>
                    <span class="text-sm text-nte-rose self-center">This wipes everything.</span>
                    <button class="btn btn-primary" @click="resetAll">Yes, reset</button>
                    <button class="btn btn-ghost" @click="confirming = false">Cancel</button>
                </template>
            </div>
        </GlassPanel>

        <GlassPanel title="About">
            <p class="text-sm text-nte-muted">
                NTE Progress · v0.1 · schema v{{ SCHEMA_VERSION }} · Companion tool for Neverness to Everness. Data is
                stored
                locally only.
            </p>
        </GlassPanel>
    </div>
</template>
