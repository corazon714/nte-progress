export type Region = "EU" | "Asia" | "US";
export type Element =
    | "Lakshana"
    | "Cosmos"
    | "Anima"
    | "Incantation"
    | "Chaos"
    | "Psyche";
export type Rarity = "S" | "A";
export type Role = "DPS" | "Sub-DPS" | "Support" | "Sustain" | "Utility";
export type Source = "Limited" | "Standard" | "Free";
export type Priority = "critical" | "high" | "medium" | "optional";
export type Scope = "daily" | "weekly" | "monthly";

export interface Character {
    id: string;
    name: string;
    rarity: Rarity;
    element: Element;
    role: Role;
    source: Source;
    notes?: string;
    recommendedArc?: string;
}

export interface Arc {
    id: string;
    name: string;
    rarity: Rarity;
    element?: Element;
    bestFor: string[];
}

export interface Task {
    id: string;
    title: string;
    scope: Scope;
    priority: Priority;
    description: string;
    rewards?: string[];
    /** Character id required to be owned for this task to be relevant */
    requires?: string[];
    link?: string;
}

export interface Tip {
    id: string;
    title: string;
    category: "Combat" | "Economy" | "Pulls" | "Mistakes" | "Exploration";
    body: string;
    tags?: string[];
}

export interface RedeemCode {
    code: string;
    reward: string;
    verifiedOn: string;
}

export interface OwnedCharacter {
    id: string;
    awakening: number; // 0..6
}

export interface UserProfile {
    setupComplete: boolean;
    region: Region;
    hunterLevel: number;
    tycoonLevel: number;
    ownedCharacters: OwnedCharacter[];
    ownedArcs: string[];
    /** Character Pixels — regenerating combat stamina (6 min/point, base cap 240). */
    characterPixels: {
        current: number;
        cap: number;
    };
    /** City Stamina — weekly resource that does NOT regen daily and resets Monday. */
    cityStamina: {
        current: number;
        cap: number;
    };
    spendingProfile: "F2P" | "MonthlyCard" | "BattlePass" | "Both";
}

export interface CurrencyState {
    annulith: number;
    solidDice: number;
    fabricatedDice: number;
    triKey: number;
    lostPieces: number;
    warpPieces: number;
    fons: number;
    beetleCoins: number;
    mhmCoins: number;
    /** pulls since last S on each banner */
    pity: {
        limited: number;
        standard: number;
        arcS: number;
        arcFeatured: number;
    };
    /** code -> claimed */
    claimedCodes: Record<string, boolean>;
    /** Weekly Annulith income samples. weekStartIso is Monday 00:00 of that week (local). */
    incomeLog: Array<{ weekStartIso: string; gained: number }>;
}

export interface ChecklistState {
    /** key: `${scope}:${cycleStartIso}:${taskId}` -> done */
    done: Record<string, boolean>;
}

export interface SettingsState {
    notifications: {
        dailyReset: boolean;
        weeklyReset: boolean;
        staminaCap: boolean;
    };
    staminaWarnHours: number;
}
