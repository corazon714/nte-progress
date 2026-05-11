<script setup lang="ts">
import { computed } from "vue";
import type { Scope, Task, Priority } from "@/types";
import { useUserStore } from "@/stores/user";
import { useChecklistStore } from "@/stores/checklist";
import { useResetTimer, formatResetAt } from "@/composables/useResetTimer";
import TaskCard from "./TaskCard.vue";
import GlassPanel from "./GlassPanel.vue";

const props = defineProps<{
    scope: Scope;
    title: string;
    subtitle: string;
    tasks: Task[];
}>();

const user = useUserStore();
const checklist = useChecklistStore();
const timer = useResetTimer(() => user.profile.region, props.scope);

const visibleTasks = computed(() => {
    return props.tasks.filter((t) => {
        if (!t.requires?.length) return true;
        return t.requires.every((id) => user.owns(id));
    });
});

const order: Priority[] = ["critical", "high", "medium", "optional"];
const grouped = computed(() => {
    const out: Record<Priority, Task[]> = { critical: [], high: [], medium: [], optional: [] };
    for (const t of visibleTasks.value) out[t.priority].push(t);
    return out;
});

const total = computed(() => visibleTasks.value.length);
const doneCount = computed(() =>
    visibleTasks.value.filter((t) => checklist.isDone(props.scope, t.id)).length,
);
const progress = computed(() => (total.value === 0 ? 0 : (doneCount.value / total.value) * 100));

const resetAt = computed(() => formatResetAt(user.profile.region, props.scope));
</script>

<template>
    <div class="space-y-5 max-w-5xl">
        <header class="flex items-end justify-between gap-4 flex-wrap">
            <div>
                <h1 class="font-display text-3xl">{{ title }}</h1>
                <p class="text-sm text-nte-muted">{{ subtitle }}</p>
            </div>
            <div class="text-right">
                <div class="text-xs uppercase tracking-wider text-nte-muted">Resets in</div>
                <div class="font-display text-2xl text-nte-cyan tabular-nums">{{ timer.display.value }}</div>
                <div class="text-[10px] text-nte-muted">{{ resetAt }}</div>
            </div>
        </header>

        <GlassPanel>
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-nte-muted">{{ doneCount }} / {{ total }} complete</span>
                <span class="font-display text-nte-violet-soft">{{ Math.round(progress) }}%</span>
            </div>
            <div class="h-2 rounded-full bg-nte-bg-2 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-nte-violet to-nte-magenta transition-all"
                    :style="{ width: `${progress}%` }" />
            </div>
        </GlassPanel>

        <div v-for="prio in order" :key="prio">
            <template v-if="grouped[prio].length">
                <h2 class="font-display text-sm uppercase tracking-[0.2em] text-nte-muted mb-2 mt-4">
                    {{ prio }}
                </h2>
                <div class="grid gap-3">
                    <TaskCard v-for="t in grouped[prio]" :key="t.id" :task="t" :done="checklist.isDone(scope, t.id)"
                        @toggle="checklist.toggle(scope, t.id)" />
                </div>
            </template>
        </div>

        <div v-if="!total" class="glass p-6 text-center text-nte-muted">
            No tasks for this scope based on your owned characters.
        </div>
    </div>
</template>
