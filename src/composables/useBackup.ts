import { loadKey, saveKey } from "@/composables/useTauriStore";
import type {
    CurrencyState,
    ChecklistState,
    SettingsState,
    UserProfile,
} from "@/types";

/** Bump this whenever the persisted JSON shape changes. */
export const SCHEMA_VERSION = 1;

/** Keys that participate in backup/restore. */
const KEYS = ["userProfile", "currency", "checklist", "settings"] as const;

export interface BackupBundle {
    schemaVersion: number;
    exportedAt: string; // ISO
    app: "nte-progress";
    data: {
        userProfile?: UserProfile;
        currency?: CurrencyState;
        checklist?: ChecklistState;
        settings?: SettingsState;
    };
}

/** Read every persisted key and wrap it with a schema version. */
export async function exportAll(): Promise<BackupBundle> {
    const data: BackupBundle["data"] = {};
    for (const k of KEYS) {
        // loadKey returns the fallback if missing; use a sentinel to detect "no value".
        const sentinel = {} as never;
        const v = await loadKey<unknown>(k, sentinel);
        if (v !== sentinel) {
            (data as Record<string, unknown>)[k] = v;
        }
    }
    return {
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        app: "nte-progress",
        data,
    };
}

/** Trigger a browser download of the current backup as JSON. */
export async function downloadBackup() {
    const bundle = await exportAll();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `nte-progress-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** Migrate older bundles in-place to the current schema. */
function migrate(bundle: BackupBundle): BackupBundle {
    let { schemaVersion, data } = bundle;
    // Add migrations here as schema evolves.
    // Example skeleton:
    // if (schemaVersion < 2) { ...transform data... ; schemaVersion = 2 }
    return { ...bundle, schemaVersion, data };
}

/** Restore from a parsed bundle. Returns the number of keys written. */
export async function importBundle(bundle: BackupBundle): Promise<number> {
    if (!bundle || bundle.app !== "nte-progress" || typeof bundle.schemaVersion !== "number") {
        throw new Error("Not a valid NTE Progress backup.");
    }
    if (bundle.schemaVersion > SCHEMA_VERSION) {
        throw new Error(
            `Backup is from a newer app version (schema v${bundle.schemaVersion}). Update the app first.`,
        );
    }
    const migrated = migrate(bundle);
    let written = 0;
    for (const k of KEYS) {
        const v = (migrated.data as Record<string, unknown>)[k];
        if (v !== undefined) {
            await saveKey(k, v);
            written++;
        }
    }
    return written;
}

/** Parse a File or string and import it. */
export async function importFromFile(file: File): Promise<number> {
    const text = await file.text();
    const parsed = JSON.parse(text) as BackupBundle;
    return importBundle(parsed);
}
