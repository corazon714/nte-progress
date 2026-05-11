import { createRouter, createWebHashHistory } from "vue-router";
import { useUserStore } from "@/stores/user";

const routes = [
    { path: "/", redirect: "/dashboard" },
    { path: "/setup", name: "setup", component: () => import("@/views/Setup.vue") },
    { path: "/dashboard", name: "dashboard", component: () => import("@/views/Dashboard.vue") },
    { path: "/daily", name: "daily", component: () => import("@/views/Daily.vue") },
    { path: "/weekly", name: "weekly", component: () => import("@/views/Weekly.vue") },
    { path: "/monthly", name: "monthly", component: () => import("@/views/Monthly.vue") },
    { path: "/currencies", name: "currencies", component: () => import("@/views/Currencies.vue") },
    { path: "/planner", name: "planner", component: () => import("@/views/Planner.vue") },
    { path: "/tips", name: "tips", component: () => import("@/views/Tips.vue") },
    { path: "/settings", name: "settings", component: () => import("@/views/Settings.vue") },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach(async (to) => {
    const user = useUserStore();
    if (!user.loaded) await user.load();
    if (!user.profile.setupComplete && to.name !== "setup") {
        return { name: "setup" };
    }
    if (user.profile.setupComplete && to.name === "setup") {
        return { name: "dashboard" };
    }
});

export default router;
