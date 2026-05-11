import { Store } from "@tauri-apps/plugin-store";

let storePromise: Promise<Store> | null = null;

async function getStore(): Promise<Store> {
    if (!storePromise) {
        storePromise = Store.load("nte-progress.json", { autoSave: true, defaults: {} });
    }
    return storePromise;
}

export async function loadKey<T>(key: string, fallback: T): Promise<T> {
    try {
        const s = await getStore();
        const v = await s.get<T>(key);
        return (v ?? fallback) as T;
    } catch (e) {
        console.warn("Tauri store load failed, using fallback for", key, e);
        const raw = localStorage.getItem(`nte:${key}`);
        if (raw) {
            try {
                return JSON.parse(raw) as T;
            } catch {
                /* ignore */
            }
        }
        return fallback;
    }
}

export async function saveKey<T>(key: string, value: T): Promise<void> {
    try {
        const s = await getStore();
        await s.set(key, value);
    } catch (e) {
        console.warn("Tauri store save failed, using localStorage for", key, e);
        localStorage.setItem(`nte:${key}`, JSON.stringify(value));
    }
}
