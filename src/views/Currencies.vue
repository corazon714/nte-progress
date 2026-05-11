<script setup lang="ts">
import { computed, ref } from "vue";
import type { CurrencyState } from "@/types";
import { useCurrencyStore } from "@/stores/currency";
import { useUserStore } from "@/stores/user";
import { getCycleStart } from "@/composables/useResetTimer";
import GlassPanel from "@/components/GlassPanel.vue";
import codes from "@/data/codes.json";
import type { RedeemCode } from "@/types";

const currency = useCurrencyStore();
const user = useUserStore();
const allCodes = codes as RedeemCode[];

type NumKey = keyof Omit<CurrencyState, "pity" | "claimedCodes">;
const fields: Array<{ key: NumKey; label: string }> = [
    { key: "annulith", label: "Annulith" },
    { key: "solidDice", label: "Solid Dice (Limited)" },
    { key: "fabricatedDice", label: "Fabricated Dice (Standard)" },
    { key: "triKey", label: "Tri-Key (Arcs)" },
    { key: "lostPieces", label: "Lost Pieces" },
    { key: "warpPieces", label: "Warp Pieces" },
    { key: "fons", label: "Fons" },
    { key: "beetleCoins", label: "Beetle Coins" },
    { key: "mhmCoins", label: "Mhm! Coins (max 100)" },
];

type BannerKey = keyof CurrencyState["pity"];
const banners: Array<{ key: BannerKey; label: string; hardPity: number; softPity: number; color: "magenta" | "cyan" | "gold"; note?: string }> = [
    { key: "limited", label: "Limited", hardPity: 90, softPity: 70, color: "magenta", note: "100% featured at pity" },
    { key: "standard", label: "Standard", hardPity: 90, softPity: 70, color: "cyan", note: "S-Selector at 50 pulls" },
    { key: "arcS", label: "Arc S-rank", hardPity: 60, softPity: 50, color: "gold", note: "Or buy directly with 25 Tri-Keys" },
    { key: "arcFeatured", label: "Arc Featured", hardPity: 80, softPity: 70, color: "gold" },
];

const annulithToPulls = computed(() => Math.floor(currency.state.annulith / 160));

// ---- Income tracker ----
const currentWeekIso = computed(() =>
    getCycleStart(user.profile.region, "weekly").toISOString(),
);
const thisWeekEntry = computed(() =>
    currency.state.incomeLog.find((e) => e.weekStartIso === currentWeekIso.value),
);
const incomeInput = ref<number>(thisWeekEntry.value?.gained ?? 0);

function saveIncome() {
    if (incomeInput.value < 0 || !Number.isFinite(incomeInput.value)) return;
    currency.logIncome(currentWeekIso.value, Math.round(incomeInput.value));
}

const recentLog = computed(() => [...currency.state.incomeLog].slice(-8).reverse());
const avgIncome = computed(() => {
    const log = currency.state.incomeLog.slice(-8);
    if (!log.length) return 0;
    return Math.round(log.reduce((a, e) => a + e.gained, 0) / log.length);
});

function formatWeek(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

async function copyCode(code: string) {
    try {
        await navigator.clipboard.writeText(code);
    } catch {
        /* ignore */
    }
}
</script>

<template>
    <div class="space-y-5 max-w-5xl">
        <header>
            <h1 class="font-display text-3xl">Currencies & Pity</h1>
            <p class="text-sm text-nte-muted">Track your progression resources and banner pity counters.</p>
        </header>

        <GlassPanel title="Currency totals" subtitle="Tap a number to edit. 160 Annulith = 1 pull.">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div v-for="f in fields" :key="String(f.key)">
                    <label class="block text-xs uppercase tracking-wider text-nte-muted mb-1">{{ f.label }}</label>
                    <input class="input" type="number" min="0" v-model.number="currency.state[f.key]" />
                </div>
            </div>
            <div class="mt-4 text-sm text-nte-muted">
                Annulith → <span class="text-nte-magenta font-display">{{ annulithToPulls }}</span> pulls available
            </div>
        </GlassPanel>

        <GlassPanel title="Pity counters" subtitle="Pulls since your last S-rank on each banner.">
            <div class="grid md:grid-cols-2 gap-4">
                <div v-for="b in banners" :key="b.key"
                    class="p-3 rounded-lg border border-nte-border/60 bg-nte-bg-2/40">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-display font-semibold">{{ b.label }}</span>
                        <span class="text-xs text-nte-muted">guarantee at {{ b.hardPity }}</span>
                    </div>
                    <input type="number" min="0" :max="b.hardPity" class="input"
                        v-model.number="currency.state.pity[b.key]" />
                    <div class="mt-2 h-2 rounded-full bg-nte-bg overflow-hidden">
                        <div class="h-full transition-all" :class="{
                            'bg-nte-magenta': b.color === 'magenta',
                            'bg-nte-cyan': b.color === 'cyan',
                            'bg-nte-gold': b.color === 'gold',
                        }" :style="{ width: `${Math.min(100, (currency.state.pity[b.key] / b.hardPity) * 100)}%` }" />
                    </div>
                    <div class="mt-2 text-xs text-nte-muted">
                        {{ Math.max(0, b.hardPity - currency.state.pity[b.key]) }} pulls to guarantee
                        <span v-if="currency.state.pity[b.key] >= b.softPity" class="text-nte-gold ml-1">• soft pity
                            active</span>
                    </div>
                    <div v-if="b.note" class="text-[10px] text-nte-muted mt-1 italic">{{ b.note }}</div>
                </div>
            </div>
        </GlassPanel>

        <GlassPanel title="Annulith income tracker"
            subtitle="Log your real weekly Annulith gains. The Planner will use your average instead of the baseline once you have 2+ weeks logged.">
            <div class="flex items-end gap-3 flex-wrap">
                <div>
                    <label class="block text-xs uppercase tracking-wider text-nte-muted mb-1">
                        This week (starting {{ formatWeek(currentWeekIso) }})
                    </label>
                    <input class="input w-40" type="number" min="0" v-model.number="incomeInput" />
                </div>
                <button class="btn btn-primary" @click="saveIncome">Save</button>
                <div v-if="avgIncome" class="ml-auto text-right">
                    <div class="text-xs uppercase text-nte-muted">Avg (last {{ Math.min(8,
                        currency.state.incomeLog.length) }} wk)</div>
                    <div class="font-display text-2xl text-nte-magenta">{{ avgIncome }}</div>
                </div>
            </div>
            <div v-if="recentLog.length" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div v-for="e in recentLog" :key="e.weekStartIso"
                    class="p-2 rounded-md bg-nte-bg-2/40 border border-nte-border/40 flex items-center justify-between">
                    <span class="text-nte-muted text-xs">{{ formatWeek(e.weekStartIso) }}</span>
                    <span class="font-display">{{ e.gained }}</span>
                    <button class="text-nte-rose/70 hover:text-nte-rose text-xs"
                        @click="currency.removeIncome(e.weekStartIso)" title="Remove">×</button>
                </div>
            </div>
        </GlassPanel>

        <GlassPanel title="Active redeem codes" subtitle="Click to copy. Mark claimed to hide.">
            <div class="grid md:grid-cols-2 gap-2">
                <div v-for="c in allCodes" :key="c.code"
                    class="flex items-center justify-between gap-2 p-2 rounded-lg border border-nte-border/60 bg-nte-bg-2/40"
                    :class="currency.state.claimedCodes[c.code] ? 'opacity-40' : ''">
                    <div class="min-w-0">
                        <button
                            class="font-mono text-sm text-nte-cyan hover:text-nte-magenta transition-colors text-left"
                            @click="copyCode(c.code)" :title="`Copy ${c.code}`">{{ c.code }}</button>
                        <div class="text-[11px] text-nte-muted truncate">{{ c.reward }}</div>
                    </div>
                    <label class="text-[10px] uppercase text-nte-muted flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" :checked="!!currency.state.claimedCodes[c.code]"
                            @change="currency.setClaimed(c.code, ($event.target as HTMLInputElement).checked)"
                            class="accent-nte-violet" />
                        Claimed
                    </label>
                </div>
            </div>
        </GlassPanel>
    </div>
</template>
