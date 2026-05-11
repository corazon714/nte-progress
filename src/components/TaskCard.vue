<script setup lang="ts">
import type { Priority, Task } from "@/types";

defineProps<{
    task: Task;
    done: boolean;
}>();

defineEmits<{
    toggle: [];
}>();

const priorityColor: Record<Priority, string> = {
    critical: "var(--color-prio-critical)",
    high: "var(--color-prio-high)",
    medium: "var(--color-prio-medium)",
    optional: "var(--color-prio-optional)",
};
const priorityLabel: Record<Priority, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    optional: "Optional",
};
</script>

<template>
    <div class="glass p-4 transition-all relative overflow-hidden" :class="done ? 'opacity-60' : ''"
        :style="{ borderLeft: `4px solid ${priorityColor[task.priority]}` }">
        <div class="flex items-start gap-3">
            <button @click="$emit('toggle')"
                class="mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all" :style="{
                    borderColor: done ? priorityColor[task.priority] : 'var(--color-nte-border)',
                    background: done ? priorityColor[task.priority] : 'transparent',
                }" :aria-label="done ? 'Mark incomplete' : 'Mark complete'">
                <span v-if="done" class="text-[12px] text-nte-bg leading-none">✓</span>
            </button>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="font-display text-base font-semibold" :class="done ? 'line-through text-nte-muted' : ''">
                        {{ task.title }}</h3>
                    <span class="tag" :style="{ color: priorityColor[task.priority] }">{{ priorityLabel[task.priority]
                        }}</span>
                </div>
                <p class="mt-1 text-sm text-nte-muted leading-relaxed">{{ task.description }}</p>
                <div v-if="task.rewards?.length" class="mt-2 flex flex-wrap gap-1.5">
                    <span v-for="r in task.rewards" :key="r"
                        class="text-[10px] px-2 py-0.5 rounded-md bg-nte-violet/10 text-nte-violet-soft border border-nte-violet/20">{{
                        r }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
