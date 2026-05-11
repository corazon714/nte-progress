<script setup lang="ts">
defineProps<{
    label: string;
    countdown: string;
    tone?: "cyan" | "violet" | "magenta" | "gold";
}>();
</script>

<template>
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-xs" :class="{
        'border-nte-cyan/40': tone === 'cyan',
        'border-nte-violet/40': tone === 'violet',
        'border-nte-magenta/40': tone === 'magenta',
        'border-nte-gold/40': tone === 'gold',
    }">
        <span class="uppercase tracking-wider text-nte-muted">{{ label }}</span>
        <span class="font-display font-semibold tabular-nums" :class="{
            'text-nte-cyan': tone === 'cyan',
            'text-nte-violet-soft': tone === 'violet',
            'text-nte-magenta': tone === 'magenta',
            'text-nte-gold': tone === 'gold',
        }">{{ countdown }}</span>
    </div>
</template>
