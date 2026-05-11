<script setup lang="ts">
import ChecklistView from "@/components/ChecklistView.vue";
import tasks from "@/data/tasks-monthly.json";
import type { Task } from "@/types";
</script>

<template>
    <ChecklistView scope="monthly" title="Monthly"
        subtitle="Resets on the 1st at 5 AM server time. Spend Lost Pieces before the cycle ends."
        :tasks="(tasks as Task[])" />
</template>
