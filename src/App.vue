<script setup lang="ts">
import { onMounted } from "vue";
import { useUserStore } from "@/stores/user";
import { useChecklistStore } from "@/stores/checklist";
import { useCurrencyStore } from "@/stores/currency";
import { useSettingsStore } from "@/stores/settings";
import AppShell from "@/components/AppShell.vue";

const user = useUserStore();
const checklist = useChecklistStore();
const currency = useCurrencyStore();
const settings = useSettingsStore();

onMounted(async () => {
  await Promise.all([user.load(), checklist.load(), currency.load(), settings.load()]);
});
</script>

<template>
  <AppShell />
</template>
