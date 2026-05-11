<script setup lang="ts">
import ChecklistView from "@/components/ChecklistView.vue";
import tasks from "@/data/tasks-weekly.json";
import type { Task } from "@/types";
</script>

<template>
    <ChecklistView scope="weekly" title="Weekly"
        subtitle="Resets every Monday at 5 AM server time. Missing the boss cap is the single biggest setback."
        :tasks="(tasks as Task[])" />
</template>
