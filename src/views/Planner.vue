<script setup lang="ts">
import { computed, ref } from "vue";
import { useUserStore } from "@/stores/user";
import { useCurrencyStore } from "@/stores/currency";
import GlassPanel from "@/components/GlassPanel.vue";
import ElementTag from "@/components/ElementTag.vue";
import charactersData from "@/data/characters.json";
import type { Character, Source } from "@/types";

const user = useUserStore();
const currency = useCurrencyStore();

const characters = (charactersData as Character[]).filter((c) => c.source !== "Free");
const target = ref<string>(characters[0]?.id ?? "");
const targetCopies = ref<number>(1); // 0 = C0, 1 = A1 ... so dupes wanted

const SPENDING_MULT: Record<string, number> = {
    F2P: 1,
    MonthlyCard: 1.55,
    BattlePass: 1.22,
    Both: 1.77,
};
const BASE_WEEKLY_ANNULITH = 1275;

const targetChar = computed<Character | undefined>(() =>
    characters.find((c) => c.id === target.value),
);
const isLimited = computed(() => targetChar.value?.source === "Limited");
const pullsPerCopy = 90; // worst case
const avgPullsPerCopy = computed(() => (isLimited.value ? 62 : 70));

const totalCopies = computed(() => 1 + Math.max(0, targetCopies.value)); // C0 = 1 copy
const worstCasePulls = computed(() => totalCopies.value * pullsPerCopy);
const avgPulls = computed(() => totalCopies.value * avgPullsPerCopy.value);

const ownedDice = computed(() =>
    isLimited.value ? currency.state.solidDice : currency.state.fabricatedDice,
);
const currentPity = computed(() =>
    isLimited.value ? currency.state.pity.limited : currency.state.pity.standard,
);

const remainingWorstPulls = computed(() =>
    Math.max(0, worstCasePulls.value - ownedDice.value - currentPity.value),
);
const remainingAvgPulls = computed(() =>
    Math.max(0, avgPulls.value - ownedDice.value - currentPity.value),
);

const annulithNeededWorst = computed(() => remainingWorstPulls.value * 160);
const annulithNeededAvg = computed(() => remainingAvgPulls.value * 160);

const totalAnnulithAvailable = computed(
    () => currency.state.annulith + ownedDice.value * 160,
);
const annulithGapWorst = computed(() =>
    Math.max(0, annulithNeededWorst.value - totalAnnulithAvailable.value),
);
const annulithGapAvg = computed(() =>
    Math.max(0, annulithNeededAvg.value - totalAnnulithAvailable.value),
);

const weeklyIncome = computed(
    () => BASE_WEEKLY_ANNULITH * SPENDING_MULT[user.profile.spendingProfile],
);
const weeksWorst = computed(() => annulithGapWorst.value / weeklyIncome.value);
const weeksAvg = computed(() => annulithGapAvg.value / weeklyIncome.value);

function fmt(n: number) {
    return new Intl.NumberFormat().format(Math.round(n));
}
function fmtWeeks(w: number) {
    if (w <= 0) return "Now ✓";
    if (w < 1) return `${Math.round(w * 7)}d`;
    return `${w.toFixed(1)} weeks`;
}

// Arc planner
const triKeyDirectBuy = 25;
const triKeyShort = computed(() => Math.max(0, triKeyDirectBuy - currency.state.triKey));
</script>

<template>
    <div class="space-y-5 max-w-5xl">
        <header>
            <h1 class="font-display text-3xl">Pull & Awakening Planner</h1>
            <p class="text-sm text-nte-muted">
                Plan your route to the next character or awakening with realistic income projections.
            </p>
        </header>

        <GlassPanel title="Character target">
            <div class="grid md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-xs uppercase tracking-wider text-nte-muted mb-1">Character</label>
                    <select class="input" v-model="target">
                        <option v-for="c in characters" :key="c.id" :value="c.id">
                            {{ c.name }} · {{ c.source as Source }}
                        </option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs uppercase tracking-wider text-nte-muted mb-1">
                        Target awakening: A{{ targetCopies }}
                    </label>
                    <input type="range" min="0" max="6" step="1" v-model.number="targetCopies"
                        class="w-full accent-nte-violet" />
                </div>
                <div>
                    <label class="block text-xs uppercase tracking-wider text-nte-muted mb-1">Spending profile</label>
                    <select class="input" v-model="user.profile.spendingProfile">
                        <option value="F2P">F2P</option>
                        <option value="MonthlyCard">Monthly Card</option>
                        <option value="BattlePass">Battle Pass</option>
                        <option value="Both">Both</option>
                    </select>
                </div>
            </div>

            <div v-if="targetChar" class="mt-4 flex items-center gap-2 text-sm text-nte-muted">
                <ElementTag :element="targetChar.element" />
                <span>{{ targetChar.role }}</span>
                <span class="opacity-50">·</span>
                <span>{{ targetChar.notes }}</span>
            </div>
        </GlassPanel>

        <div class="grid md:grid-cols-2 gap-4">
            <GlassPanel title="Average case" subtitle="Soft pity assumed (~62 pulls per copy on Limited).">
                <dl class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <dt class="text-nte-muted">Pulls needed</dt>
                        <dd class="font-display">{{ fmt(remainingAvgPulls) }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-nte-muted">Annulith needed</dt>
                        <dd class="font-display text-nte-magenta">{{ fmt(annulithNeededAvg) }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-nte-muted">Income gap</dt>
                        <dd class="font-display">{{ fmt(annulithGapAvg) }}</dd>
                    </div>
                    <div class="flex justify-between border-t border-nte-border/60 pt-2 mt-2">
                        <dt class="text-nte-muted">Time to target</dt>
                        <dd class="font-display text-nte-cyan text-lg">{{ fmtWeeks(weeksAvg) }}</dd>
                    </div>
                </dl>
            </GlassPanel>

            <GlassPanel title="Worst case" subtitle="Hard pity every copy (90 pulls).">
                <dl class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <dt class="text-nte-muted">Pulls needed</dt>
                        <dd class="font-display">{{ fmt(remainingWorstPulls) }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-nte-muted">Annulith needed</dt>
                        <dd class="font-display text-nte-magenta">{{ fmt(annulithNeededWorst) }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-nte-muted">Income gap</dt>
                        <dd class="font-display">{{ fmt(annulithGapWorst) }}</dd>
                    </div>
                    <div class="flex justify-between border-t border-nte-border/60 pt-2 mt-2">
                        <dt class="text-nte-muted">Time to target</dt>
                        <dd class="font-display text-nte-cyan text-lg">{{ fmtWeeks(weeksWorst) }}</dd>
                    </div>
                </dl>
            </GlassPanel>
        </div>

        <GlassPanel title="Income assumptions">
            <p class="text-sm text-nte-muted">
                Weekly Annulith income (your profile <span class="text-nte-cyan">{{ user.profile.spendingProfile
                    }}</span>):
                <span class="text-nte-magenta font-display ml-1">{{ fmt(weeklyIncome) }}</span>
                Annulith ≈ <span class="text-nte-magenta font-display">{{ Math.round(weeklyIncome / 160) }}</span> pulls
                / week
            </p>
            <p class="text-xs text-nte-muted mt-1">
                Baseline: ~115 daily + 470 weekly = 1,275/week F2P (research v2 §5).
                Multipliers: F2P ×1.0, Monthly Card ×1.55, BP ×1.22, Both ×1.77.
            </p>
        </GlassPanel>

        <GlassPanel title="Arc planner — Tri-Key direct buy" subtitle="25 Tri-Keys = any specific S-Class Arc.">
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-sm text-nte-muted">You have</div>
                    <div class="font-display text-2xl text-nte-gold">{{ currency.state.triKey }} / {{ triKeyDirectBuy }}
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm text-nte-muted">Need</div>
                    <div class="font-display text-2xl">{{ triKeyShort }} more</div>
                </div>
            </div>
            <div class="mt-3 h-2 rounded-full bg-nte-bg-2 overflow-hidden">
                <div class="h-full bg-nte-gold"
                    :style="{ width: `${Math.min(100, (currency.state.triKey / triKeyDirectBuy) * 100)}%` }" />
            </div>
        </GlassPanel>
    </div>
</template>
