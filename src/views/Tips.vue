<script setup lang="ts">
import { computed, ref } from "vue";
import MarkdownIt from "markdown-it";
import GlassPanel from "@/components/GlassPanel.vue";
import tipsData from "@/data/tips.json";
import type { Tip } from "@/types";

const tips = tipsData as Tip[];
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const categories = ["All", "Combat", "Economy", "Pulls", "Mistakes", "Exploration"] as const;
const activeCat = ref<(typeof categories)[number]>("All");
const query = ref("");

const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    return tips.filter((t) => {
        const catOk = activeCat.value === "All" || t.category === activeCat.value;
        if (!catOk) return false;
        if (!q) return true;
        return (
            t.title.toLowerCase().includes(q) ||
            t.body.toLowerCase().includes(q) ||
            (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
        );
    });
});

function render(body: string): string {
    return md.render(body);
}
</script>

<template>
    <div class="space-y-5 max-w-5xl">
        <header>
            <h1 class="font-display text-3xl">Tips & Tricks</h1>
            <p class="text-sm text-nte-muted">
                Curated lessons from the v1 + v2 research. Use the filters to find what matters.
            </p>
        </header>

        <GlassPanel>
            <div class="flex items-center gap-3 flex-wrap">
                <input class="input flex-1 min-w-[220px]" placeholder="Search tips, tags…" v-model="query" />
                <div class="flex gap-1.5 flex-wrap">
                    <button v-for="c in categories" :key="c" class="btn"
                        :class="activeCat === c ? 'btn-primary' : 'btn-ghost'" @click="activeCat = c">{{ c }}</button>
                </div>
            </div>
        </GlassPanel>

        <div class="grid md:grid-cols-2 gap-4">
            <article v-for="t in filtered" :key="t.id" class="glass p-4">
                <div class="flex items-center gap-2 mb-1">
                    <span class="tag text-nte-cyan border-nte-cyan/60">{{ t.category }}</span>
                    <span v-for="tag in t.tags" :key="tag"
                        class="text-[10px] px-2 py-0.5 rounded-md bg-nte-violet/10 text-nte-violet-soft border border-nte-violet/20">#{{
                        tag }}</span>
                </div>
                <h3 class="font-display text-lg font-semibold">{{ t.title }}</h3>
                <div class="prose-tip mt-2 text-sm text-nte-text/90 leading-relaxed" v-html="render(t.body)" />
            </article>
        </div>

        <div v-if="!filtered.length" class="glass p-6 text-center text-nte-muted">
            No tips match the current filters.
        </div>
    </div>
</template>

<style scoped>
:deep(.prose-tip strong) {
    color: var(--color-nte-cyan);
}

:deep(.prose-tip code) {
    background: rgba(125, 75, 255, 0.15);
    padding: 0 4px;
    border-radius: 4px;
    font-size: 0.85em;
}
</style>
