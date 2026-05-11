<script setup lang="ts">
import ChecklistView from "@/components/ChecklistView.vue";
import tasks from "@/data/tasks-daily.json";
import type { Task } from "@/types";
</script>

<template>
    <ChecklistView scope="daily" title="Daily" subtitle="Resets every day at 5 AM server time."
        :tasks="(tasks as Task[])" />
</template>
