<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import charactersData from "@/data/characters.json";
import arcsData from "@/data/arcs.json";
import type { Character, Arc, Region } from "@/types";
import ElementTag from "@/components/ElementTag.vue";

const router = useRouter();
const user = useUserStore();
const characters = charactersData as Character[];
const arcs = arcsData as Arc[];

const step = ref(1);

function isOwned(id: string): boolean {
    return user.profile.ownedCharacters.some((c) => c.id === id);
}
function awakeningOf(id: string): number {
    return user.profile.ownedCharacters.find((c) => c.id === id)?.awakening ?? 0;
}
function toggleChar(id: string) {
    user.setOwned(id, !isOwned(id), 0);
}
function setAwk(id: string, ev: Event) {
    user.setAwakening(id, Number((ev.target as HTMLInputElement).value));
}
function toggleArc(id: string) {
    const set = new Set(user.profile.ownedArcs);
    set.has(id) ? set.delete(id) : set.add(id);
    user.profile.ownedArcs = Array.from(set);
}

function finish() {
    user.profile.setupComplete = true;
    router.push({ name: "dashboard" });
}

const regions: Region[] = ["EU", "Asia", "US"];
</script>

<template>
    <div class="w-full max-w-3xl glass-strong p-8">
        <div class="flex items-center gap-3 mb-6">
            <div class="font-display text-3xl neon-text">NTE Progress</div>
            <span class="tag text-nte-cyan border-nte-cyan">Setup {{ step }} / 3</span>
        </div>

        <!-- Step 1: Basics -->
        <div v-if="step === 1" class="space-y-5">
            <h2 class="text-xl font-display">Account basics</h2>

            <div>
                <label class="block text-xs uppercase tracking-wider text-nte-muted mb-2">Server region</label>
                <div class="flex gap-2">
                    <button v-for="r in regions" :key="r" class="btn"
                        :class="user.profile.region === r ? 'btn-primary' : 'btn-ghost'"
                        @click="user.profile.region = r">{{ r }}</button>
                </div>
                <p class="text-xs text-nte-muted mt-2">Used for daily/weekly/monthly reset countdowns (5 AM server
                    time).</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs uppercase tracking-wider text-nte-muted mb-2">Hunter Level</label>
                    <input class="input" type="number" min="1" max="100" v-model.number="user.profile.hunterLevel" />
                </div>
                <div>
                    <label class="block text-xs uppercase tracking-wider text-nte-muted mb-2">City Tycoon Level</label>
                    <input class="input" type="number" min="1" max="50" v-model.number="user.profile.tycoonLevel" />
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
                <div>
                    <label class="block text-xs uppercase tracking-wider text-nte-muted mb-2">Character Pixels
                        cap</label>
                    <input class="input" type="number" min="240" max="500"
                        v-model.number="user.profile.characterPixels.cap" />
                    <p class="text-[11px] text-nte-muted mt-1">Combat stamina · regens 6 min/point.</p>
                </div>
                <div>
                    <label class="block text-xs uppercase tracking-wider text-nte-muted mb-2">City Stamina cap</label>
                    <input class="input" type="number" min="60" max="400"
                        v-model.number="user.profile.cityStamina.cap" />
                    <p class="text-[11px] text-nte-muted mt-1">Weekly · resets Monday, no daily regen.</p>
                </div>
                <div>
                    <label class="block text-xs uppercase tracking-wider text-nte-muted mb-2">Spending profile</label>
                    <select class="input" v-model="user.profile.spendingProfile">
                        <option value="F2P">F2P</option>
                        <option value="MonthlyCard">Monthly Card</option>
                        <option value="BattlePass">Battle Pass</option>
                        <option value="Both">Both</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Step 2: Characters -->
        <div v-else-if="step === 2" class="space-y-4">
            <h2 class="text-xl font-display">Owned characters</h2>
            <p class="text-sm text-nte-muted">Tap to toggle. Adjust awakening (0–6) for owned characters.</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                <div v-for="c in characters" :key="c.id" class="glass p-3 cursor-pointer transition-all"
                    :class="isOwned(c.id) ? 'border-nte-violet/70 ring-1 ring-nte-violet/40' : 'opacity-70'"
                    @click="toggleChar(c.id)">
                    <div class="flex items-center justify-between">
                        <span class="font-display font-semibold">{{ c.name }}</span>
                        <span class="tag"
                            :class="c.rarity === 'S' ? 'text-nte-gold border-nte-gold' : 'text-nte-cyan border-nte-cyan'">{{
                                c.rarity }}</span>
                    </div>
                    <div class="mt-1 flex items-center gap-2">
                        <ElementTag :element="c.element" />
                        <span class="text-[10px] text-nte-muted uppercase">{{ c.role }}</span>
                    </div>
                    <div v-if="isOwned(c.id)" class="mt-2" @click.stop>
                        <label class="text-[10px] uppercase tracking-wider text-nte-muted">Awakening: A{{
                            awakeningOf(c.id) }}</label>
                        <input type="range" min="0" max="6" :value="awakeningOf(c.id)" @input="setAwk(c.id, $event)"
                            class="w-full accent-nte-violet" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Step 3: Arcs -->
        <div v-else-if="step === 3" class="space-y-4">
            <h2 class="text-xl font-display">Owned Arcs</h2>
            <p class="text-sm text-nte-muted">Optional. Used by the Planner to recommend the next Arc to buy with
                Tri-Keys.</p>
            <div class="grid grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                <div v-for="a in arcs" :key="a.id" class="glass p-3 cursor-pointer transition-all"
                    :class="user.profile.ownedArcs.includes(a.id) ? 'border-nte-cyan/70 ring-1 ring-nte-cyan/40' : 'opacity-70'"
                    @click="toggleArc(a.id)">
                    <div class="flex items-center justify-between">
                        <span class="font-display font-semibold">{{ a.name }}</span>
                        <span class="tag text-nte-gold border-nte-gold">{{ a.rarity }}</span>
                    </div>
                    <div v-if="a.element" class="mt-1">
                        <ElementTag :element="a.element" />
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-6 flex justify-between items-center">
            <button v-if="step > 1" class="btn btn-ghost" @click="step--">Back</button>
            <span v-else />
            <button v-if="step < 3" class="btn btn-primary" @click="step++">Next</button>
            <button v-else class="btn btn-primary" @click="finish">Enter NTE Progress</button>
        </div>
    </div>
</template>
