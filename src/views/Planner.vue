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

// Real weekly income (from currency.incomeLog), if user has at least 2 weeks logged.
const loggedAvgIncome = computed(() => {
    const log = currency.state.incomeLog;
    if (log.length < 2) return null;
    const recent = log.slice(-8); // last up-to-8 weeks
    const sum = recent.reduce((acc, e) => acc + e.gained, 0);
    return sum / recent.length;
});

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
    () =>
        loggedAvgIncome.value ??
        BASE_WEEKLY_ANNULITH * SPENDING_MULT[user.profile.spendingProfile],
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

// ----------------- Pull simulator (Monte Carlo) -----------------
// Model (Limited banner, matches research v2 numbers ~62 avg pulls/copy):
//   - Base S rate 0.6% for pulls 1..70
//   - Soft pity ramp: pull n (71..89) -> 0.6% + (n-70)*5.2% (caps near 99%)
//   - Hard pity at pull 90 -> 100%
//   - On S hit: 50% featured, 50% standard. Losing 50/50 guarantees next S is featured.
// Standard banner reuses the same curve but every S hit counts as featured (no 50/50).
function probS(pullSinceLastS: number): number {
    const n = pullSinceLastS;
    if (n >= 90) return 1;
    if (n <= 70) return 0.006;
    return Math.min(1, 0.006 + (n - 70) * 0.052);
}

function simulateOnce(opts: {
    copiesNeeded: number;
    startPity: number;
    isLimited: boolean;
    startLost5050: boolean;
}): number {
    let pity = opts.startPity;
    let pulls = 0;
    let lost = opts.startLost5050;
    let copies = 0;
    while (copies < opts.copiesNeeded) {
        pulls++;
        pity++;
        if (Math.random() < probS(pity)) {
            pity = 0;
            if (!opts.isLimited) {
                copies++;
                continue;
            }
            // 50/50 with guarantee on prior loss
            if (lost || Math.random() < 0.5) {
                copies++;
                lost = false;
            } else {
                lost = true;
            }
        }
    }
    return pulls;
}

function percentile(sorted: number[], p: number): number {
    const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
    return sorted[idx];
}

const simRunning = ref(false);
const simResult = ref<{ p50: number; p75: number; p90: number; mean: number; pullsAffordable: number } | null>(null);

async function runSimulation() {
    simRunning.value = true;
    simResult.value = null;
    await new Promise((r) => setTimeout(r, 0));
    const trials = 10_000;
    const results: number[] = new Array(trials);
    const copiesNeeded = totalCopies.value;
    const limited = isLimited.value;
    const startPity = currentPity.value;
    for (let i = 0; i < trials; i++) {
        results[i] = simulateOnce({
            copiesNeeded,
            startPity,
            isLimited: limited,
            startLost5050: false,
        });
    }
    results.sort((a, b) => a - b);
    const mean = results.reduce((a, b) => a + b, 0) / trials;
    const pullsAffordable = Math.floor(totalAnnulithAvailable.value / 160);
    simResult.value = {
        p50: percentile(results, 0.5),
        p75: percentile(results, 0.75),
        p90: percentile(results, 0.9),
        mean,
        pullsAffordable,
    };
    simRunning.value = false;
}
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
            <p v-if="loggedAvgIncome" class="text-xs text-nte-cyan mt-1">
                ✓ Using your logged average ({{ currency.state.incomeLog.length }} week(s)) instead of the baseline.
            </p>
            <p class="text-xs text-nte-muted mt-1">
                Baseline: ~115 daily + 470 weekly = 1,275/week F2P (research v2 §5).
                Multipliers: F2P ×1.0, Monthly Card ×1.55, BP ×1.22, Both ×1.77.
                Log your real weekly gains in Currencies → Income tracker.
            </p>
        </GlassPanel>

        <GlassPanel title="Pull simulator" subtitle="10,000-trial Monte Carlo against the current pity + 50/50 state.">
            <div class="flex items-center gap-3 flex-wrap">
                <button class="btn btn-primary" :disabled="simRunning" @click="runSimulation">
                    {{ simRunning ? "Running…" : "Run simulation" }}
                </button>
                <span class="text-xs text-nte-muted">
                    Target: {{ totalCopies }} {{ totalCopies === 1 ? "copy" : "copies" }} of
                    <span class="text-nte-cyan">{{ targetChar?.name ?? "—" }}</span>.
                    Current pity: <span class="text-nte-cyan">{{ currentPity }}</span>.
                </span>
            </div>
            <div v-if="simResult" class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                <div class="glass p-3">
                    <div class="text-[10px] uppercase tracking-wider text-nte-muted">P50 (median)</div>
                    <div class="font-display text-2xl text-nte-cyan tabular-nums">{{ fmt(simResult.p50) }}</div>
                    <div class="text-[11px] text-nte-muted">pulls (~{{ fmt(simResult.p50 * 160) }} Annulith)</div>
                </div>
                <div class="glass p-3">
                    <div class="text-[10px] uppercase tracking-wider text-nte-muted">P75</div>
                    <div class="font-display text-2xl text-nte-violet-soft tabular-nums">{{ fmt(simResult.p75) }}</div>
                    <div class="text-[11px] text-nte-muted">pulls</div>
                </div>
                <div class="glass p-3">
                    <div class="text-[10px] uppercase tracking-wider text-nte-muted">P90 (safe)</div>
                    <div class="font-display text-2xl text-nte-magenta tabular-nums">{{ fmt(simResult.p90) }}</div>
                    <div class="text-[11px] text-nte-muted">pulls</div>
                </div>
                <div class="glass p-3">
                    <div class="text-[10px] uppercase tracking-wider text-nte-muted">Mean</div>
                    <div class="font-display text-2xl tabular-nums">{{ fmt(simResult.mean) }}</div>
                    <div class="text-[11px] text-nte-muted">pulls</div>
                </div>
            </div>
            <div v-if="simResult" class="mt-3 text-sm">
                You can afford <span class="text-nte-cyan font-display">{{ fmt(simResult.pullsAffordable) }}</span>
                pulls now.
                <span v-if="simResult.pullsAffordable >= simResult.p90" class="text-nte-cyan">✓ Comfortably within
                    P90.</span>
                <span v-else-if="simResult.pullsAffordable >= simResult.p50" class="text-nte-gold">~50% chance with
                    current Annulith.</span>
                <span v-else class="text-nte-rose">Below median — save more before pulling.</span>
            </div>
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
