<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useSettingsStore } from "@/stores/settings";
import { useChecklistStore } from "@/stores/checklist";
import { useCurrencyStore } from "@/stores/currency";
import GlassPanel from "@/components/GlassPanel.vue";
import type { Region } from "@/types";

const router = useRouter();
const user = useUserStore();
const settings = useSettingsStore();
const checklist = useChecklistStore();
const currency = useCurrencyStore();

const regions: Region[] = ["EU", "Asia", "US"];
const confirming = ref(false);

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
    });
    confirming.value = false;
    router.push({ name: "setup" });
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
                NTE Progress · v0.1 · Companion tool for Neverness to Everness. Data is stored locally only.
            </p>
        </GlassPanel>
    </div>
</template>
