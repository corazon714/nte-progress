import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

export async function ensurePermission(): Promise<boolean> {
    try {
        let granted = await isPermissionGranted();
        if (!granted) {
            const p = await requestPermission();
            granted = p === "granted";
        }
        return granted;
    } catch (e) {
        console.warn("Notification permission check failed", e);
        return false;
    }
}

export async function notify(title: string, body: string): Promise<void> {
    try {
        if (await ensurePermission()) {
            sendNotification({ title, body });
        }
    } catch (e) {
        console.warn("notify failed", e);
    }
}
