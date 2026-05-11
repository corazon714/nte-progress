<script setup lang="ts">
defineProps<{ title?: string; subtitle?: string }>();
</script>

<template>
    <section class="glass p-5">
        <header v-if="title" class="mb-3">
            <h2 class="font-display text-lg font-semibold tracking-wider">{{ title }}</h2>
            <p v-if="subtitle" class="text-xs text-nte-muted mt-0.5">{{ subtitle }}</p>
        </header>
        <slot />
    </section>
</template>
