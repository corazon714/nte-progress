import { computed, ref, onMounted, onUnmounted } from "vue";
import { fromZonedTime, toZonedTime, format } from "date-fns-tz";
import {
    addDays,
    addMonths,
    startOfMonth,
    startOfWeek,
    setHours,
    setMinutes,
    setSeconds,
    setMilliseconds,
    differenceInMilliseconds,
    isAfter,
} from "date-fns";
import type { Region, Scope } from "@/types";

export const REGION_TZ: Record<Region, string> = {
    EU: "Europe/Paris",
    Asia: "Asia/Singapore",
    US: "America/New_York",
};

const RESET_HOUR = 5;

/** Get the start instant (UTC Date) of the current cycle in the user's region. */
export function getCycleStart(region: Region, scope: Scope, ref: Date = new Date()): Date {
    const tz = REGION_TZ[region];
    const local = toZonedTime(ref, tz);

    let localStart: Date;
    if (scope === "daily") {
        let s = setMilliseconds(setSeconds(setMinutes(setHours(local, RESET_HOUR), 0), 0), 0);
        if (isAfter(s, local)) s = addDays(s, -1);
        localStart = s;
    } else if (scope === "weekly") {
        // Monday 5 AM
        let s = startOfWeek(local, { weekStartsOn: 1 });
        s = setMilliseconds(setSeconds(setMinutes(setHours(s, RESET_HOUR), 0), 0), 0);
        if (isAfter(s, local)) s = addDays(s, -7);
        localStart = s;
    } else {
        // monthly: 1st 5 AM
        let s = startOfMonth(local);
        s = setMilliseconds(setSeconds(setMinutes(setHours(s, RESET_HOUR), 0), 0), 0);
        if (isAfter(s, local)) s = addMonths(s, -1);
        localStart = s;
    }

    return fromZonedTime(localStart, tz);
}

export function getNextReset(region: Region, scope: Scope, ref: Date = new Date()): Date {
    const start = getCycleStart(region, scope, ref);
    if (scope === "daily") return addDays(start, 1);
    if (scope === "weekly") return addDays(start, 7);
    return addMonths(start, 1);
}

export function formatCountdown(ms: number): string {
    if (ms <= 0) return "00:00:00";
    const total = Math.floor(ms / 1000);
    const days = Math.floor(total / 86400);
    const h = String(Math.floor((total % 86400) / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return days > 0 ? `${days}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
}

export function formatResetAt(region: Region, scope: Scope): string {
    const next = getNextReset(region, scope);
    return format(toZonedTime(next, REGION_TZ[region]), "EEE MMM d, HH:mm zzz", {
        timeZone: REGION_TZ[region],
    });
}

export function useResetTimer(regionRef: () => Region, scope: Scope) {
    const now = ref(Date.now());
    let id: number | undefined;
    onMounted(() => {
        id = window.setInterval(() => {
            now.value = Date.now();
        }, 1000);
    });
    onUnmounted(() => {
        if (id) window.clearInterval(id);
    });

    const next = computed(() => getNextReset(regionRef(), scope, new Date(now.value)));
    const remainingMs = computed(() => differenceInMilliseconds(next.value, new Date(now.value)));
    const display = computed(() => formatCountdown(remainingMs.value));

    return { now, next, remainingMs, display };
}
