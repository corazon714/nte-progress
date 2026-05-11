<script setup lang="ts">
import type { Element } from "@/types";

const elementColor: Record<Element, string> = {
    Lakshana: "var(--color-nte-gold)",
    Cosmos: "var(--color-nte-cyan)",
    Anima: "#7be08a",
    Incantation: "var(--color-nte-rose)",
    Chaos: "var(--color-nte-violet)",
    Psyche: "#7d9bff",
};

defineProps<{ element: Element }>();
</script>

<template>
    <span class="tag" :style="{ color: elementColor[element], borderColor: elementColor[element] }">{{ element }}</span>
</template>
