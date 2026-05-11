<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useResetTimer } from "@/composables/useResetTimer";
import ResetCountdown from "./ResetCountdown.vue";

const route = useRoute();
const router = useRouter();
const user = useUserStore();

const nav = [
    { name: "dashboard", label: "Dashboard", icon: "◆" },
    { name: "daily", label: "Daily", icon: "☀" },
    { name: "weekly", label: "Weekly", icon: "◷" },
    { name: "monthly", label: "Monthly", icon: "✦" },
    { name: "currencies", label: "Currencies", icon: "◈" },
    { name: "planner", label: "Planner", icon: "✶" },
    { name: "tips", label: "Tips", icon: "✺" },
    { name: "settings", label: "Settings", icon: "⚙" },
];

const region = computed(() => user.profile.region);
const daily = useResetTimer(() => region.value, "daily");
const weekly = useResetTimer(() => region.value, "weekly");

const isSetup = computed(() => route.name === "setup");
</script>

<template>
    <div v-if="isSetup" class="min-h-screen w-full flex items-center justify-center p-6">
        <RouterView />
    </div>
    <div v-else class="min-h-screen w-full flex">
        <!-- Sidebar -->
        <aside class="w-60 shrink-0 p-4 flex flex-col gap-2 border-r border-nte-border/60">
            <div class="px-2 py-3 mb-2">
                <div class="font-display text-2xl tracking-widest neon-text">NTE</div>
                <div class="text-xs uppercase tracking-[0.3em] text-nte-muted">Progress</div>
            </div>
            <button v-for="item in nav" :key="item.name" @click="router.push({ name: item.name })"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all" :class="route.name === item.name
                        ? 'bg-nte-violet/20 text-nte-violet-soft border border-nte-violet/40 shadow-[0_0_18px_-6px_rgba(125,75,255,0.6)]'
                        : 'text-nte-muted hover:text-nte-text hover:bg-nte-surface/60 border border-transparent'
                    ">
                <span class="text-base">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
            </button>
            <div class="mt-auto px-2 text-[10px] text-nte-muted/70 uppercase tracking-wider">
                Region: <span class="text-nte-cyan">{{ region }}</span>
            </div>
        </aside>

        <!-- Main -->
        <div class="flex-1 flex flex-col min-w-0">
            <header class="flex items-center justify-end gap-3 px-6 py-3 border-b border-nte-border/60">
                <ResetCountdown label="Daily" :countdown="daily.display.value" tone="cyan" />
                <ResetCountdown label="Weekly" :countdown="weekly.display.value" tone="violet" />
            </header>
            <main class="flex-1 overflow-y-auto p-6">
                <RouterView />
            </main>
        </div>
    </div>
</template>
