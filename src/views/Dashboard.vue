<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useChecklistStore } from "@/stores/checklist";
import { useCurrencyStore } from "@/stores/currency";
import { useSettingsStore } from "@/stores/settings";
import { useResetTimer, formatResetAt } from "@/composables/useResetTimer";
import { notify } from "@/composables/useNotifications";
import GlassPanel from "@/components/GlassPanel.vue";
import dailyData from "@/data/tasks-daily.json";
import weeklyData from "@/data/tasks-weekly.json";
import codes from "@/data/codes.json";
import type { Task, RedeemCode } from "@/types";

const router = useRouter();
const user = useUserStore();
const checklist = useChecklistStore();
const currency = useCurrencyStore();
const settings = useSettingsStore();

const dailyTasks = (dailyData as Task[]).filter(
    (t) => !t.requires?.length || t.requires.every((id) => user.owns(id)),
);
const weeklyTasks = (weeklyData as Task[]).filter(
    (t) => !t.requires?.length || t.requires.every((id) => user.owns(id)),
);

const dailyTimer = useResetTimer(() => user.profile.region, "daily");
const weeklyTimer = useResetTimer(() => user.profile.region, "weekly");
const monthlyTimer = useResetTimer(() => user.profile.region, "monthly");

const criticalDailyOpen = computed(() =>
    dailyTasks.filter((t) => t.priority === "critical" && !checklist.isDone("daily", t.id)),
);
const criticalWeeklyOpen = computed(() =>
    weeklyTasks.filter((t) => t.priority === "critical" && !checklist.isDone("weekly", t.id)),
);

// Stamina overflow projection
const STAMINA_REGEN_MIN_PER_POINT = 6;
const hoursToCap = computed(() => {
    const left = Math.max(0, user.profile.stamina.cap - user.profile.stamina.current);
    return (left * STAMINA_REGEN_MIN_PER_POINT) / 60;
});
const staminaWarn = computed(() => hoursToCap.value <= settings.state.staminaWarnHours);
const spendBy = computed(() => {
    const d = new Date(Date.now() + hoursToCap.value * 3600_000);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
});

const annulithToPulls = computed(() => Math.floor(currency.state.annulith / 160));
const nearestPity = computed(() => {
    const items = [
        { label: "Limited", left: 90 - currency.state.pity.limited },
        { label: "Standard", left: 90 - currency.state.pity.standard },
        { label: "Arc S", left: 60 - currency.state.pity.arcS },
    ];
    return items.sort((a, b) => a.left - b.left)[0];
});

const unclaimedCodes = computed(() =>
    (codes as RedeemCode[]).filter((c) => !currency.state.claimedCodes[c.code]),
);

// Notification scheduler
let intervalId: number | undefined;
const lastFiredKey = ref<Record<string, string>>({});

function fireOnce(key: string, title: string, body: string) {
    const today = new Date().toISOString().slice(0, 13); // hourly bucket
    const k = `${key}:${today}`;
    if (lastFiredKey.value[k]) return;
    lastFiredKey.value[k] = "1";
    notify(title, body);
}

onMounted(() => {
    intervalId = window.setInterval(() => {
        if (settings.state.notifications.dailyReset && criticalDailyOpen.value.length) {
            const ms = dailyTimer.remainingMs.value;
            if (ms > 0 && ms < 60 * 60 * 1000) {
                fireOnce(
                    "daily-1h",
                    "NTE — Daily reset in <1h",
                    `${criticalDailyOpen.value.length} critical task(s) still open.`,
                );
            }
        }
        if (settings.state.notifications.weeklyReset && criticalWeeklyOpen.value.length) {
            const ms = weeklyTimer.remainingMs.value;
            if (ms > 0 && ms < 6 * 60 * 60 * 1000) {
                fireOnce(
                    "weekly-6h",
                    "NTE — Weekly reset in <6h",
                    `${criticalWeeklyOpen.value.length} critical weekly task(s) still open. Spend City Stamina!`,
                );
            }
        }
        if (settings.state.notifications.staminaCap && staminaWarn.value) {
            fireOnce(
                "stamina-cap",
                "NTE — Stamina capping soon",
                `Spend Character Pixels by ${spendBy.value} or you'll start losing regen.`,
            );
        }
    }, 60_000);
});

onUnmounted(() => {
    if (intervalId) window.clearInterval(intervalId);
});
</script>

<template>
    <div class="space-y-5 max-w-6xl">
        <header class="flex items-end justify-between">
            <div>
                <h1 class="font-display text-3xl">Dashboard</h1>
                <p class="text-sm text-nte-muted">Your account at a glance.</p>
            </div>
            <div class="text-xs text-nte-muted">
                Hunter Lv {{ user.profile.hunterLevel }} · Tycoon Lv {{ user.profile.tycoonLevel }} · {{
                    user.profile.region }}
            </div>
        </header>

        <!-- Reset timers -->
        <div class="grid md:grid-cols-3 gap-4">
            <GlassPanel title="Daily reset">
                <div class="font-display text-3xl text-nte-cyan tabular-nums">{{ dailyTimer.display.value }}</div>
                <div class="text-[11px] text-nte-muted mt-1">{{ formatResetAt(user.profile.region, 'daily') }}</div>
            </GlassPanel>
            <GlassPanel title="Weekly reset">
                <div class="font-display text-3xl text-nte-violet-soft tabular-nums">{{ weeklyTimer.display.value }}
                </div>
                <div class="text-[11px] text-nte-muted mt-1">{{ formatResetAt(user.profile.region, 'weekly') }}</div>
            </GlassPanel>
            <GlassPanel title="Monthly reset">
                <div class="font-display text-3xl text-nte-magenta tabular-nums">{{ monthlyTimer.display.value }}</div>
                <div class="text-[11px] text-nte-muted mt-1">{{ formatResetAt(user.profile.region, 'monthly') }}</div>
            </GlassPanel>
        </div>

        <!-- Critical tasks -->
        <GlassPanel :title="`Critical tasks open (${criticalDailyOpen.length + criticalWeeklyOpen.length})`"
            subtitle="The 🔵 items that move your account forward most.">
            <div v-if="!criticalDailyOpen.length && !criticalWeeklyOpen.length" class="text-sm text-nte-muted">
                All critical tasks complete. ✓
            </div>
            <div v-else class="grid md:grid-cols-2 gap-3">
                <div v-for="t in criticalDailyOpen" :key="`d-${t.id}`"
                    class="p-2 rounded-lg border border-prio-critical/40 bg-nte-bg-2/40">
                    <div class="flex items-center justify-between">
                        <span class="font-display">{{ t.title }}</span>
                        <span class="tag text-prio-critical">Daily</span>
                    </div>
                </div>
                <div v-for="t in criticalWeeklyOpen" :key="`w-${t.id}`"
                    class="p-2 rounded-lg border border-prio-critical/40 bg-nte-bg-2/40">
                    <div class="flex items-center justify-between">
                        <span class="font-display">{{ t.title }}</span>
                        <span class="tag text-prio-critical">Weekly</span>
                    </div>
                </div>
            </div>
            <div class="mt-3 flex gap-2">
                <button class="btn btn-ghost" @click="router.push({ name: 'daily' })">Open Daily →</button>
                <button class="btn btn-ghost" @click="router.push({ name: 'weekly' })">Open Weekly →</button>
            </div>
        </GlassPanel>

        <!-- Stamina warning -->
        <GlassPanel title="Character Pixels (Stamina)">
            <div class="flex items-center justify-between gap-4 flex-wrap">
                <div class="flex items-center gap-3">
                    <input type="number" min="0" :max="user.profile.stamina.cap" class="input w-24"
                        v-model.number="user.profile.stamina.current" />
                    <span class="text-nte-muted">/ {{ user.profile.stamina.cap }}</span>
                </div>
                <div class="text-right">
                    <div class="text-xs text-nte-muted uppercase tracking-wider">Caps in</div>
                    <div class="font-display text-xl tabular-nums"
                        :class="staminaWarn ? 'text-nte-rose' : 'text-nte-cyan'">{{ hoursToCap.toFixed(1) }}h</div>
                    <div class="text-[11px] text-nte-muted">spend by ~{{ spendBy }}</div>
                </div>
            </div>
            <div v-if="staminaWarn"
                class="mt-3 p-2 rounded-lg border border-nte-rose/50 bg-nte-rose/10 text-sm text-nte-rose">
                Stamina will cap soon — log in and spend your Pixels to keep them generating.
            </div>
        </GlassPanel>

        <!-- Currency snapshot + codes -->
        <div class="grid md:grid-cols-2 gap-4">
            <GlassPanel title="Currency snapshot">
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="flex justify-between"><span class="text-nte-muted">Annulith</span><span
                            class="font-display text-nte-magenta">{{ currency.state.annulith }}</span></div>
                    <div class="flex justify-between"><span class="text-nte-muted">Pulls available</span><span
                            class="font-display">{{ annulithToPulls }}</span></div>
                    <div class="flex justify-between"><span class="text-nte-muted">Solid Dice</span><span
                            class="font-display">{{ currency.state.solidDice }}</span></div>
                    <div class="flex justify-between"><span class="text-nte-muted">Fabricated Dice</span><span
                            class="font-display">{{ currency.state.fabricatedDice }}</span></div>
                    <div class="flex justify-between"><span class="text-nte-muted">Tri-Keys</span><span
                            class="font-display text-nte-gold">{{ currency.state.triKey }}</span></div>
                    <div class="flex justify-between"><span class="text-nte-muted">Mhm! Coins</span><span
                            class="font-display">{{ currency.state.mhmCoins }}/100</span></div>
                </div>
                <div class="mt-3 text-xs text-nte-muted">
                    Nearest pity: <span class="text-nte-cyan">{{ nearestPity.label }}</span> in
                    <span class="text-nte-cyan">{{ Math.max(0, nearestPity.left) }}</span> pulls
                </div>
            </GlassPanel>

            <GlassPanel :title="`Unclaimed codes (${unclaimedCodes.length})`">
                <div v-if="!unclaimedCodes.length" class="text-sm text-nte-muted">All caught up. ✓</div>
                <div v-else class="flex flex-wrap gap-2">
                    <span v-for="c in unclaimedCodes.slice(0, 8)" :key="c.code"
                        class="font-mono text-xs px-2 py-1 rounded-md bg-nte-cyan/10 text-nte-cyan border border-nte-cyan/30">{{
                        c.code }}</span>
                </div>
                <button class="btn btn-ghost mt-3" @click="router.push({ name: 'currencies' })">Manage codes →</button>
            </GlassPanel>
        </div>
    </div>
</template>
